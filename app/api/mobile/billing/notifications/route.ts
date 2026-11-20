import { z } from "zod";
import { json } from "@/lib/presence";
import { appleStore, verifyAppleSubscription } from "@/lib/apple-store";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  if (process.env.APPLE_IAP_ENABLED !== "true") return json({ error: "apple_billing_unavailable" }, { status: 503 });
  const parsed = z.object({ signedPayload: z.string().min(1).max(200_000) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_notification" }, { status: 400 });
  const checkedAt = new Date().toISOString();
  try {
    const { verifier } = appleStore();
    const notification = await verifier.verifyAndDecodeNotification(parsed.data.signedPayload);
    if (notification.notificationType === "TEST") return json({ ok: true });
    const signed = notification.data?.signedTransactionInfo;
    // No identity or transaction is inferred from an unverified notification field.
    if (!signed) return json({ ok: true, ignored: true });
    const transaction = await verifier.verifyAndDecodeTransaction(signed);
    if (!transaction.appAccountToken) return json({ error: "account_binding_missing" }, { status: 409 });
    const snapshot = await verifyAppleSubscription(signed, transaction.appAccountToken);
    const { error } = await createAdminSupabaseClient().rpc("apply_apple_subscription", { p_snapshot: snapshot, p_checked_at: checkedAt });
    if (error) return json({ error: "entitlement_sync_failed" }, { status: 503 });
    return json({ ok: true }); // Re-delivery is idempotent; failed sync returns 5xx for Apple retries.
  } catch { return json({ error: "notification_verification_failed" }, { status: 503 }); }
}
