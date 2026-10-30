import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { paddleRequest, planForPriceId, sha256, verifyPaddleSignature } from "@/lib/paddle";
import { json } from "@/lib/presence";

export const runtime = "nodejs";

type PaddleEvent = {
  event_id: string;
  event_type: string;
  occurred_at: string;
  data: Record<string, unknown> & { id?: string; customer_id?: string; status?: string; custom_data?: Record<string, unknown> };
};

function text(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

function firstPriceId(data: PaddleEvent["data"]) {
  const items = Array.isArray(data.items) ? data.items : [];
  const first = items[0] as { price?: { id?: unknown } } | undefined;
  return text(first?.price?.id);
}

async function userForEvent(admin: ReturnType<typeof createAdminSupabaseClient>, event: PaddleEvent) {
  const customUserId = text(event.data.custom_data?.user_id);
  if (customUserId) return customUserId;
  const customerId = text(event.data.customer_id);
  if (customerId) {
    const { data } = await admin.from("billing_customers").select("user_id").eq("provider_customer_id", customerId).maybeSingle();
    if (data?.user_id) return data.user_id as string;
  }
  const transactionId = text(event.data.transaction_id);
  if (transactionId) {
    const { data } = await admin.from("billing_transactions").select("user_id").eq("provider_transaction_id", transactionId).maybeSingle();
    if (data?.user_id) return data.user_id as string;
  }
  return null;
}

async function syncCustomer(admin: ReturnType<typeof createAdminSupabaseClient>, userId: string, customerId: string | null) {
  if (!customerId) return;
  const { error } = await admin.from("billing_customers").upsert({ user_id: userId, provider_customer_id: customerId, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw error;
}

async function syncSubscription(admin: ReturnType<typeof createAdminSupabaseClient>, event: PaddleEvent, userId: string) {
  const subscriptionId = text(event.data.id);
  const priceId = firstPriceId(event.data);
  const status = text(event.data.status);
  if (!subscriptionId || !priceId || !status) return false;
  const plan = planForPriceId(priceId);
  if (plan !== "plus_monthly" && plan !== "plus_annual") return false;
  const { data: existing } = await admin.from("subscriptions").select("provider_occurred_at").eq("provider_subscription_id", subscriptionId).maybeSingle();
  if (existing?.provider_occurred_at && Date.parse(existing.provider_occurred_at) > Date.parse(event.occurred_at)) return true;
  const currentBillingPeriod = event.data.current_billing_period as { starts_at?: unknown; ends_at?: unknown } | null;
  const scheduledChange = event.data.scheduled_change as { action?: unknown } | null;
  const { error } = await admin.from("subscriptions").upsert({
    provider_subscription_id: subscriptionId,
    user_id: userId,
    price_id: priceId,
    plan_key: plan,
    status,
    current_period_start: text(currentBillingPeriod?.starts_at),
    current_period_end: text(currentBillingPeriod?.ends_at),
    cancel_at_period_end: text(scheduledChange?.action) === "cancel",
    provider_occurred_at: event.occurred_at,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  const active = new Set(["active", "trialing", "past_due"]).has(status);
  const expiresAt = active ? text(currentBillingPeriod?.ends_at) : new Date(event.occurred_at).toISOString();
  const { error: entitlementError } = await admin.from("entitlements").upsert({
    user_id: userId, entitlement_key: "focus_core_access", source_type: "subscription", source_id: subscriptionId,
    active, expires_at: expiresAt, updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,entitlement_key,source_type,source_id" });
  if (entitlementError) throw entitlementError;
  return true;
}

async function syncTransaction(admin: ReturnType<typeof createAdminSupabaseClient>, event: PaddleEvent, userId: string) {
  const transactionId = text(event.data.id);
  const priceId = firstPriceId(event.data);
  const status = text(event.data.status) || "completed";
  if (!transactionId || !priceId) return false;
  const plan = planForPriceId(priceId);
  if (!plan) return false;
  const { data: existing } = await admin.from("billing_transactions").select("provider_occurred_at").eq("provider_transaction_id", transactionId).maybeSingle();
  if (existing?.provider_occurred_at && Date.parse(existing.provider_occurred_at) > Date.parse(event.occurred_at)) return true;
  const totals = event.data.details as { totals?: { total?: unknown; currency_code?: unknown } } | null;
  const subscriptionId = text(event.data.subscription_id);
  const { error } = await admin.from("billing_transactions").upsert({
    provider_transaction_id: transactionId, user_id: userId, provider_subscription_id: subscriptionId,
    price_id: priceId, plan_key: plan, status, amount: text(totals?.totals?.total),
    currency: text(totals?.totals?.currency_code), provider_occurred_at: event.occurred_at,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  if (plan === "founder_lifetime" && status === "completed") {
    const { error: entitlementError } = await admin.from("entitlements").upsert({
      user_id: userId, entitlement_key: "focus_core_access", source_type: "lifetime", source_id: transactionId,
      active: true, expires_at: null, updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,entitlement_key,source_type,source_id" });
    if (entitlementError) throw entitlementError;
    const { data: activeSubscriptions, error: subscriptionLookupError } = await admin.from("subscriptions")
      .select("provider_subscription_id").eq("user_id", userId).in("status", ["active", "trialing", "past_due"]);
    if (subscriptionLookupError) throw subscriptionLookupError;
    for (const subscription of activeSubscriptions || []) {
      await paddleRequest(`/subscriptions/${encodeURIComponent(subscription.provider_subscription_id)}`, {
        method: "PATCH",
        body: JSON.stringify({ scheduled_change: { action: "cancel", effective_at: "next_billing_period" } }),
      });
      await admin.from("subscriptions").update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
        .eq("provider_subscription_id", subscription.provider_subscription_id);
    }
  }
  return true;
}

async function syncRefund(admin: ReturnType<typeof createAdminSupabaseClient>, event: PaddleEvent) {
  const transactionId = text(event.data.transaction_id);
  const status = text(event.data.status);
  const action = text(event.data.action);
  if (!transactionId || action !== "refund" || !new Set(["approved", "reversed"]).has(status || "")) return false;
  const refunded = status === "approved";
  const { error } = await admin.from("billing_transactions").update({ refunded_at: refunded ? event.occurred_at : null, updated_at: new Date().toISOString() }).eq("provider_transaction_id", transactionId);
  if (error) throw error;
  const { error: entitlementError } = await admin.from("entitlements").update({ active: !refunded, updated_at: new Date().toISOString() }).eq("source_type", "lifetime").eq("source_id", transactionId);
  if (entitlementError) throw entitlementError;
  return true;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyPaddleSignature(rawBody, request.headers.get("paddle-signature"))) return json({ error: "invalid_signature" }, { status: 401 });
  let event: PaddleEvent;
  try { event = JSON.parse(rawBody) as PaddleEvent; } catch { return json({ error: "invalid_payload" }, { status: 400 }); }
  if (!event.event_id || !event.event_type || !event.occurred_at || !event.data) return json({ error: "invalid_payload" }, { status: 400 });

  const admin = createAdminSupabaseClient();
  const { error: eventError } = await admin.from("billing_events").insert({
    provider_event_id: event.event_id, event_type: event.event_type, occurred_at: event.occurred_at,
    payload_sha256: sha256(rawBody), status: "processing",
  });
  if (eventError?.code === "23505") {
    const { data: stored } = await admin.from("billing_events").select("status,payload_sha256").eq("provider_event_id", event.event_id).maybeSingle();
    if (stored?.payload_sha256 !== sha256(rawBody)) return json({ error: "event_id_payload_mismatch" }, { status: 409 });
    if (stored?.status !== "failed") return json({ ok: true, duplicate: true });
    await admin.from("billing_events").update({ status: "processing", error: null, processed_at: null }).eq("provider_event_id", event.event_id);
  }
  if (eventError && eventError.code !== "23505") return json({ error: "event_store_failed" }, { status: 503 });

  try {
    let handled = false;
    const userId = await userForEvent(admin, event);
    if (userId) await syncCustomer(admin, userId, text(event.data.customer_id));
    if (userId && event.event_type.startsWith("subscription.")) handled = await syncSubscription(admin, event, userId);
    if (userId && event.event_type === "transaction.completed") handled = await syncTransaction(admin, event, userId);
    if (event.event_type.startsWith("adjustment.")) handled = await syncRefund(admin, event);
    await admin.from("billing_events").update({ status: handled ? "processed" : "ignored", processed_at: new Date().toISOString() }).eq("provider_event_id", event.event_id);
    return json({ ok: true });
  } catch (error) {
    await admin.from("billing_events").update({ status: "failed", error: error instanceof Error ? error.message.slice(0, 500) : "unknown", processed_at: new Date().toISOString() }).eq("provider_event_id", event.event_id);
    return json({ error: "webhook_processing_failed" }, { status: 500 });
  }
}
