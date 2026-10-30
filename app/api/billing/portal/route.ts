import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { stripeClient } from "@/lib/stripe";
import { authenticatedSupabase, json } from "@/lib/presence";

export async function POST() {
  const auth = await authenticatedSupabase();
  if (!auth || auth.user.is_anonymous) return json({ error: "authentication_required" }, { status: 401 });
  const admin = createAdminSupabaseClient();
  const { data } = await admin.from("billing_customers")
    .select("provider_customer_id")
    .eq("user_id", auth.user.id)
    .eq("provider", "stripe")
    .maybeSingle();
  if (!data?.provider_customer_id) return json({ error: "billing_customer_not_found" }, { status: 404 });
  try {
    const configured = process.env.NEXT_PUBLIC_APP_URL;
    if (!configured) throw new Error("application_url_not_configured");
    const portal = await stripeClient().billingPortal.sessions.create({
      customer: data.provider_customer_id,
      return_url: `${new URL(configured).origin}/`,
    });
    return json({ portalUrl: portal.url });
  } catch {
    return json({ error: "portal_failed" }, { status: 503 });
  }
}
