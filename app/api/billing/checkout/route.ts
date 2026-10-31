import Stripe from "stripe";
import { z } from "zod";
import { canonicalApplicationOrigin } from "@/lib/deployment-safety";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { PLAN_KEYS, stripeClient, validatedPriceForPlan } from "@/lib/stripe";
import { authenticatedSupabase, json } from "@/lib/presence";
import { rateLimited } from "@/lib/security";

const schema = z.object({ plan: z.enum(PLAN_KEYS) });

export async function POST(request: Request) {
  if (rateLimited(request, "billing-checkout", 10, 10 * 60_000)) return json({ error: "rate_limited" }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_plan" }, { status: 400 });
  const auth = await authenticatedSupabase();
  if (!auth || auth.user.is_anonymous) return json({ error: "registration_required" }, { status: 401 });
  if (!auth.user.email) return json({ error: "account_email_required" }, { status: 403 });

  try {
    const stripe = stripeClient();
    const admin = createAdminSupabaseClient();
    const { data: storedCustomer, error: customerLookupError } = await admin.from("billing_customers")
      .select("provider_customer_id")
      .eq("user_id", auth.user.id)
      .eq("provider", "stripe")
      .maybeSingle();
    if (customerLookupError) throw customerLookupError;

    let customerId = storedCustomer?.provider_customer_id as string | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: auth.user.email,
        metadata: { user_id: auth.user.id },
      }, { idempotencyKey: `focus-island-customer-${auth.user.id}` });
      customerId = customer.id;
      const { error: customerStoreError } = await admin.from("billing_customers").upsert({
        user_id: auth.user.id,
        provider: "stripe",
        provider_customer_id: customerId,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (customerStoreError) throw customerStoreError;
    }

    const price = await validatedPriceForPlan(parsed.data.plan);
    const origin = canonicalApplicationOrigin(request.url);
    const mode = parsed.data.plan === "founder_lifetime" ? "payment" : "subscription";
    const metadata = { user_id: auth.user.id, plan_key: parsed.data.plan };
    const params: Stripe.Checkout.SessionCreateParams = {
      mode,
      customer: customerId,
      client_reference_id: auth.user.id,
      line_items: [{ price: price.priceId, quantity: 1 }],
      metadata,
      success_url: `${origin}/?billing=confirming`,
      cancel_url: `${origin}/?billing=canceled`,
      allow_promotion_codes: false,
      billing_address_collection: "auto",
      ...(process.env.STRIPE_MANAGED_PAYMENTS === "true"
        ? { managed_payments: { enabled: true } }
        : { automatic_tax: { enabled: process.env.STRIPE_AUTOMATIC_TAX === "true" } }),
      ...(mode === "subscription" ? { subscription_data: { metadata } } : { payment_intent_data: { metadata } }),
    };
    const session = await stripe.checkout.sessions.create(params);
    return session.url
      ? json({ transactionId: session.id, checkoutUrl: session.url })
      : json({ error: "checkout_url_unavailable" }, { status: 503 });
  } catch (error) {
    const known = new Set([
      "founder_lifetime_unavailable",
      "billing_price_mismatch",
      "billing_plan_not_configured",
      "stripe_environment_mismatch",
      "application_url_not_configured",
      "application_url_not_secure",
    ]);
    const code = error instanceof Error && known.has(error.message) ? error.message : "checkout_failed";
    return json({ error: code }, { status: code === "founder_lifetime_unavailable" ? 409 : 503 });
  }
}
