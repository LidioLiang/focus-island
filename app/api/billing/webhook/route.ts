import { sha256 } from "@/lib/crypto";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { planForPriceId, priceIdForPlan, stripeClient, stripeEvent } from "@/lib/stripe";
import { json } from "@/lib/presence";

export const runtime = "nodejs";

type AdminClient = ReturnType<typeof createAdminSupabaseClient>;
type ObjectRef = string | { id?: string } | null | undefined;
type Metadata = Record<string, string> | null | undefined;
type SubscriptionObject = {
  id: string;
  customer: ObjectRef;
  status: string;
  cancel_at_period_end?: boolean;
  metadata?: Metadata;
  items?: { data?: Array<{ price?: { id?: string }; current_period_start?: number; current_period_end?: number }> };
};
type CheckoutSessionObject = {
  id: string;
  customer: ObjectRef;
  client_reference_id?: string | null;
  payment_intent?: ObjectRef;
  payment_status?: string;
  amount_total?: number | null;
  currency?: string | null;
  metadata?: Metadata;
};
type InvoiceObject = {
  id: string;
  customer: ObjectRef;
  amount_paid?: number;
  currency?: string;
  parent?: { subscription_details?: { subscription?: ObjectRef; metadata?: Metadata } | null } | null;
};
type ChargeObject = { payment_intent?: ObjectRef; refunded?: boolean; amount_refunded?: number };
type DisputeObject = { charge?: ObjectRef; status?: string };

function objectId(value: ObjectRef) {
  return typeof value === "string" ? value : value?.id || null;
}

function eventTime(created: number) {
  return new Date(created * 1000).toISOString();
}

function isNewer(stored: string | null | undefined, incoming: string) {
  return Boolean(stored && Date.parse(stored) > Date.parse(incoming));
}

async function userFor(admin: AdminClient, metadata: Metadata, customerId: string | null, transactionId?: string | null) {
  const metadataUserId = metadata?.user_id;
  if (metadataUserId) return metadataUserId;
  if (customerId) {
    const { data } = await admin.from("billing_customers").select("user_id").eq("provider", "stripe").eq("provider_customer_id", customerId).maybeSingle();
    if (data?.user_id) return data.user_id as string;
  }
  if (transactionId) {
    const { data } = await admin.from("billing_transactions").select("user_id").eq("provider_transaction_id", transactionId).maybeSingle();
    if (data?.user_id) return data.user_id as string;
  }
  return null;
}

async function syncCustomer(admin: AdminClient, userId: string, customerId: string | null) {
  if (!customerId) return;
  const { error } = await admin.from("billing_customers").upsert({
    user_id: userId,
    provider: "stripe",
    provider_customer_id: customerId,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (error) throw error;
}

async function syncSubscription(admin: AdminClient, subscription: SubscriptionObject, userId: string, occurredAt: string) {
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.id;
  const plan = priceId ? planForPriceId(priceId) : null;
  if (!priceId || (plan !== "plus_monthly" && plan !== "plus_annual")) return false;

  const { data: existing } = await admin.from("subscriptions")
    .select("provider_occurred_at")
    .eq("provider_subscription_id", subscription.id)
    .maybeSingle();
  if (isNewer(existing?.provider_occurred_at, occurredAt)) return true;

  const periodStart = item?.current_period_start ? new Date(item.current_period_start * 1000).toISOString() : null;
  const periodEnd = item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null;
  const { error } = await admin.from("subscriptions").upsert({
    provider_subscription_id: subscription.id,
    user_id: userId,
    price_id: priceId,
    plan_key: plan,
    status: subscription.status,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    provider_occurred_at: occurredAt,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;

  const active = new Set(["active", "trialing", "past_due"]).has(subscription.status);
  const { error: entitlementError } = await admin.from("entitlements").upsert({
    user_id: userId,
    entitlement_key: "focus_core_access",
    source_type: "subscription",
    source_id: subscription.id,
    active,
    expires_at: active ? periodEnd : occurredAt,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,entitlement_key,source_type,source_id" });
  if (entitlementError) throw entitlementError;
  return true;
}

async function ensureSubscription(admin: AdminClient, subscriptionId: string, userId: string, occurredAt: string) {
  const { data } = await admin.from("subscriptions")
    .select("price_id,plan_key")
    .eq("provider_subscription_id", subscriptionId)
    .maybeSingle();
  if (data?.price_id && data?.plan_key) return data;
  const subscription = await stripeClient().subscriptions.retrieve(subscriptionId) as unknown as SubscriptionObject;
  await syncSubscription(admin, subscription, userId, occurredAt);
  const { data: stored } = await admin.from("subscriptions")
    .select("price_id,plan_key")
    .eq("provider_subscription_id", subscriptionId)
    .maybeSingle();
  return stored;
}

async function syncInvoice(admin: AdminClient, invoice: InvoiceObject, status: string, occurredAt: string) {
  const subscriptionId = objectId(invoice.parent?.subscription_details?.subscription);
  const customerId = objectId(invoice.customer);
  if (!subscriptionId) return false;
  const userId = await userFor(admin, invoice.parent?.subscription_details?.metadata, customerId);
  if (!userId) return false;
  await syncCustomer(admin, userId, customerId);
  const subscription = await ensureSubscription(admin, subscriptionId, userId, occurredAt);
  if (!subscription?.price_id || !subscription.plan_key) return false;

  const { data: existing } = await admin.from("billing_transactions")
    .select("provider_occurred_at")
    .eq("provider_transaction_id", invoice.id)
    .maybeSingle();
  if (isNewer(existing?.provider_occurred_at, occurredAt)) return true;
  const { error } = await admin.from("billing_transactions").upsert({
    provider_transaction_id: invoice.id,
    user_id: userId,
    provider_subscription_id: subscriptionId,
    price_id: subscription.price_id,
    plan_key: subscription.plan_key,
    status,
    amount: String(invoice.amount_paid || 0),
    currency: invoice.currency?.toUpperCase() || "USD",
    provider_occurred_at: occurredAt,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return true;
}

async function syncLifetimeCheckout(admin: AdminClient, session: CheckoutSessionObject, occurredAt: string) {
  if (!new Set(["paid", "no_payment_required"]).has(session.payment_status || "")) return false;
  if (session.metadata?.plan_key !== "founder_lifetime") return false;
  const paymentIntentId = objectId(session.payment_intent);
  const customerId = objectId(session.customer);
  const userId = session.metadata?.user_id || session.client_reference_id || await userFor(admin, session.metadata, customerId, paymentIntentId);
  if (!paymentIntentId || !userId) return false;
  await syncCustomer(admin, userId, customerId);

  const priceId = priceIdForPlan("founder_lifetime");
  const { data: existing } = await admin.from("billing_transactions")
    .select("provider_occurred_at")
    .eq("provider_transaction_id", paymentIntentId)
    .maybeSingle();
  if (!isNewer(existing?.provider_occurred_at, occurredAt)) {
    const { error } = await admin.from("billing_transactions").upsert({
      provider_transaction_id: paymentIntentId,
      user_id: userId,
      provider_subscription_id: null,
      price_id: priceId,
      plan_key: "founder_lifetime",
      status: "completed",
      amount: String(session.amount_total || 0),
      currency: session.currency?.toUpperCase() || "USD",
      provider_occurred_at: occurredAt,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  }
  const { error: entitlementError } = await admin.from("entitlements").upsert({
    user_id: userId,
    entitlement_key: "focus_core_access",
    source_type: "lifetime",
    source_id: paymentIntentId,
    active: true,
    expires_at: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id,entitlement_key,source_type,source_id" });
  if (entitlementError) throw entitlementError;

  const { data: activeSubscriptions, error: subscriptionLookupError } = await admin.from("subscriptions")
    .select("provider_subscription_id")
    .eq("user_id", userId)
    .in("status", ["active", "trialing", "past_due"]);
  if (subscriptionLookupError) throw subscriptionLookupError;
  for (const subscription of activeSubscriptions || []) {
    await stripeClient().subscriptions.update(subscription.provider_subscription_id, { cancel_at_period_end: true });
    await admin.from("subscriptions")
      .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
      .eq("provider_subscription_id", subscription.provider_subscription_id);
  }
  return true;
}

async function syncRefund(admin: AdminClient, charge: ChargeObject, occurredAt: string) {
  const paymentIntentId = objectId(charge.payment_intent);
  if (!paymentIntentId) return false;
  const fullyRefunded = Boolean(charge.refunded);
  const { data: existing } = await admin.from("billing_transactions")
    .select("provider_occurred_at")
    .eq("provider_transaction_id", paymentIntentId)
    .maybeSingle();
  if (!existing || isNewer(existing.provider_occurred_at, occurredAt)) return Boolean(existing);
  const { error } = await admin.from("billing_transactions").update({
    status: fullyRefunded ? "refunded" : "partially_refunded",
    refunded_at: fullyRefunded ? occurredAt : null,
    provider_occurred_at: occurredAt,
    updated_at: new Date().toISOString(),
  }).eq("provider_transaction_id", paymentIntentId);
  if (error) throw error;
  if (fullyRefunded) {
    const { error: entitlementError } = await admin.from("entitlements")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("source_type", "lifetime")
      .eq("source_id", paymentIntentId);
    if (entitlementError) throw entitlementError;
  }
  return true;
}

async function syncDispute(admin: AdminClient, dispute: DisputeObject, eventType: string, occurredAt: string) {
  const chargeId = objectId(dispute.charge);
  if (!chargeId) return false;
  const charge = await stripeClient().charges.retrieve(chargeId);
  const paymentIntentId = objectId(charge.payment_intent as ObjectRef);
  if (!paymentIntentId) return false;
  const { data: existing } = await admin.from("billing_transactions")
    .select("provider_occurred_at")
    .eq("provider_transaction_id", paymentIntentId)
    .maybeSingle();
  if (!existing || isNewer(existing.provider_occurred_at, occurredAt)) return Boolean(existing);
  const restored = eventType === "charge.dispute.closed" && dispute.status === "won";
  const status = restored ? "completed" : eventType === "charge.dispute.closed" ? "dispute_lost" : "disputed";
  const { error } = await admin.from("billing_transactions").update({ status, provider_occurred_at: occurredAt, updated_at: new Date().toISOString() })
    .eq("provider_transaction_id", paymentIntentId);
  if (error) throw error;
  const { error: entitlementError } = await admin.from("entitlements")
    .update({ active: restored, updated_at: new Date().toISOString() })
    .eq("source_type", "lifetime")
    .eq("source_id", paymentIntentId);
  if (entitlementError) throw entitlementError;
  return true;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  let event;
  try {
    event = stripeEvent(rawBody, request.headers.get("stripe-signature"));
  } catch {
    return json({ error: "invalid_signature" }, { status: 401 });
  }
  const occurredAt = eventTime(event.created);
  const admin = createAdminSupabaseClient();
  const payloadHash = sha256(rawBody);
  const { error: eventError } = await admin.from("billing_events").insert({
    provider_event_id: event.id,
    event_type: event.type,
    occurred_at: occurredAt,
    payload_sha256: payloadHash,
    status: "processing",
  });
  if (eventError?.code === "23505") {
    const { data: stored } = await admin.from("billing_events").select("status,payload_sha256").eq("provider_event_id", event.id).maybeSingle();
    if (stored?.payload_sha256 !== payloadHash) return json({ error: "event_id_payload_mismatch" }, { status: 409 });
    if (stored?.status !== "failed") return json({ ok: true, duplicate: true });
    await admin.from("billing_events").update({ status: "processing", error: null, processed_at: null }).eq("provider_event_id", event.id);
  }
  if (eventError && eventError.code !== "23505") return json({ error: "event_store_failed" }, { status: 503 });

  try {
    let handled = false;
    if (event.type.startsWith("customer.subscription.")) {
      const subscription = event.data.object as unknown as SubscriptionObject;
      const customerId = objectId(subscription.customer);
      const userId = await userFor(admin, subscription.metadata, customerId);
      if (userId) {
        await syncCustomer(admin, userId, customerId);
        handled = await syncSubscription(admin, subscription, userId, occurredAt);
      }
    } else if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
      handled = await syncInvoice(admin, event.data.object as unknown as InvoiceObject, event.type === "invoice.paid" ? "paid" : "payment_failed", occurredAt);
    } else if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      handled = await syncLifetimeCheckout(admin, event.data.object as unknown as CheckoutSessionObject, occurredAt);
    } else if (event.type === "charge.refunded") {
      handled = await syncRefund(admin, event.data.object as unknown as ChargeObject, occurredAt);
    } else if (event.type === "charge.dispute.created" || event.type === "charge.dispute.closed") {
      handled = await syncDispute(admin, event.data.object as unknown as DisputeObject, event.type, occurredAt);
    }
    await admin.from("billing_events").update({ status: handled ? "processed" : "ignored", processed_at: new Date().toISOString() }).eq("provider_event_id", event.id);
    return json({ ok: true });
  } catch (error) {
    await admin.from("billing_events").update({
      status: "failed",
      error: error instanceof Error ? error.message.slice(0, 500) : "unknown",
      processed_at: new Date().toISOString(),
    }).eq("provider_event_id", event.id);
    return json({ error: "webhook_processing_failed" }, { status: 500 });
  }
}
