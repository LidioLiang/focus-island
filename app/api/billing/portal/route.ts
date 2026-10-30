import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { paddleRequest } from "@/lib/paddle";
import { authenticatedSupabase, json } from "@/lib/presence";

type PortalResponse = { data: { urls?: { general?: { overview?: string } } } };

export async function POST() {
  const auth = await authenticatedSupabase();
  if (!auth || auth.user.is_anonymous) return json({ error: "authentication_required" }, { status: 401 });
  const admin = createAdminSupabaseClient();
  const { data } = await admin.from("billing_customers").select("provider_customer_id").eq("user_id", auth.user.id).maybeSingle();
  if (!data?.provider_customer_id) return json({ error: "billing_customer_not_found" }, { status: 404 });
  try {
    const portal = await paddleRequest<PortalResponse>(`/customers/${encodeURIComponent(data.provider_customer_id)}/portal-sessions`, { method: "POST", body: "{}" });
    const portalUrl = portal.data.urls?.general?.overview;
    return portalUrl ? json({ portalUrl }) : json({ error: "portal_url_unavailable" }, { status: 503 });
  } catch {
    return json({ error: "portal_failed" }, { status: 503 });
  }
}
