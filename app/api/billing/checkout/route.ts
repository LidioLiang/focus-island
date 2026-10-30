import { z } from "zod";
import { PLAN_KEYS, paddleRequest, validatedPriceForPlan } from "@/lib/paddle";
import { authenticatedSupabase, json } from "@/lib/presence";
import { rateLimited } from "@/lib/security";

const schema = z.object({ plan: z.enum(PLAN_KEYS) });

type PaddleTransactionResponse = { data: { id: string; checkout?: { url?: string } } };

export async function POST(request: Request) {
  if (rateLimited(request, "billing-checkout", 10, 10 * 60_000)) return json({ error: "rate_limited" }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_plan" }, { status: 400 });
  const auth = await authenticatedSupabase();
  if (!auth || auth.user.is_anonymous) return json({ error: "registration_required" }, { status: 401 });
  if (!auth.user.email_confirmed_at || !auth.user.email) return json({ error: "email_verification_required" }, { status: 403 });
  try {
    const price = await validatedPriceForPlan(parsed.data.plan);
    const result = await paddleRequest<PaddleTransactionResponse>("/transactions", {
      method: "POST",
      body: JSON.stringify({
        items: [{ price_id: price.priceId, quantity: 1 }],
        custom_data: { user_id: auth.user.id, plan_key: parsed.data.plan },
      }),
    });
    const checkoutUrl = result.data.checkout?.url;
    if (!checkoutUrl) return json({ error: "checkout_url_unavailable" }, { status: 503 });
    return json({ transactionId: result.data.id, checkoutUrl });
  } catch (error) {
    const known = new Set(["founder_lifetime_unavailable", "billing_price_mismatch", "billing_plan_not_configured"]);
    const code = error instanceof Error && known.has(error.message) ? error.message : "checkout_failed";
    return json({ error: code }, { status: code === "founder_lifetime_unavailable" ? 409 : 503 });
  }
}
