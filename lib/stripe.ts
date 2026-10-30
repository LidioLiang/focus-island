import "server-only";

import Stripe from "stripe";

export const PLAN_KEYS = ["plus_monthly", "plus_annual", "founder_lifetime"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

export const EXPECTED_PLAN_PRICES: Record<PlanKey, { amount: number; currency: "usd"; interval: "month" | "year" | null }> = {
  plus_monthly: { amount: 499, currency: "usd", interval: "month" },
  plus_annual: { amount: 1999, currency: "usd", interval: "year" },
  founder_lifetime: { amount: 3999, currency: "usd", interval: null },
};

const PRICE_ENV_NAMES: Record<PlanKey, string> = {
  plus_monthly: "STRIPE_PRICE_PLUS_MONTHLY",
  plus_annual: "STRIPE_PRICE_PLUS_ANNUAL",
  founder_lifetime: "STRIPE_PRICE_FOUNDER_LIFETIME",
};

let client: Stripe | null = null;
let clientKey: string | null = null;

export function stripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured");
  if (!client || clientKey !== secretKey) {
    client = new Stripe(secretKey, { maxNetworkRetries: 2 });
    clientKey = secretKey;
  }
  return client;
}

export function priceIdForPlan(plan: PlanKey) {
  if (plan === "founder_lifetime") {
    if (process.env.FOUNDER_LIFETIME_ENABLED !== "true") throw new Error("founder_lifetime_unavailable");
    const deadline = process.env.FOUNDER_LIFETIME_ENDS_AT;
    if (deadline && Date.parse(deadline) <= Date.now()) throw new Error("founder_lifetime_unavailable");
  }
  const value = process.env[PRICE_ENV_NAMES[plan]];
  if (!value) throw new Error("billing_plan_not_configured");
  return value;
}

export function planForPriceId(priceId: string): PlanKey | null {
  for (const key of PLAN_KEYS) {
    if (process.env[PRICE_ENV_NAMES[key]] === priceId) return key;
  }
  return null;
}

export async function validatedPriceForPlan(plan: PlanKey) {
  const priceId = priceIdForPlan(plan);
  const price = await stripeClient().prices.retrieve(priceId);
  const expected = EXPECTED_PLAN_PRICES[plan];
  const interval = price.recurring?.interval || null;
  const intervalCount = price.recurring?.interval_count || null;
  if (
    !price.active
    || price.unit_amount !== expected.amount
    || price.currency !== expected.currency
    || interval !== expected.interval
    || (expected.interval !== null && intervalCount !== 1)
    || (expected.interval === null && price.type !== "one_time")
  ) {
    throw new Error("billing_price_mismatch");
  }
  return { priceId, amount: String(expected.amount), currency: expected.currency.toUpperCase(), interval: expected.interval };
}

export function stripeEvent(rawBody: string, signature: string | null) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret || !signature) throw new Error("invalid_signature");
  return stripeClient().webhooks.constructEvent(rawBody, signature, webhookSecret);
}
