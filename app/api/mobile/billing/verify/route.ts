import { z } from "zod";
import { authenticatedSupabase, json } from "@/lib/presence";
import { verifyAppleSubscription } from "@/lib/apple-store";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { rateLimited } from "@/lib/security";

export async function POST(request: Request) {
  if (process.env.APPLE_IAP_ENABLED !== "true") return json({ error: "apple_billing_unavailable" }, { status: 503 });
  if (rateLimited(request, "apple-verify", 30)) return json({ error: "rate_limited" }, { status: 429 });
  const auth = await authenticatedSupabase();
  if (!auth || auth.user.is_anonymous) return json({ error: "registration_required" }, { status: 401 });
  const parsed = z.object({ signedTransaction: z.string().min(1).max(100_000) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_request" }, { status: 400 });
  const checkedAt = new Date().toISOString();
  try {
    const snapshot = await verifyAppleSubscription(parsed.data.signedTransaction, auth.user.id);
    const { error } = await createAdminSupabaseClient().rpc("apply_apple_subscription", { p_snapshot: snapshot, p_checked_at: checkedAt });
    if (error) return json({ error: "entitlement_sync_failed" }, { status: 503 });
    return json({ ok: true, active: snapshot.active, environment: snapshot.environment, expiresAt: snapshot.expiresAt }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const known = ["purchase_account_mismatch", "unknown_product", "invalid_transaction"];
    return json({ error: known.includes(message) ? message : "purchase_verification_unavailable" }, { status: known.includes(message) ? 409 : 503 });
  }
}
