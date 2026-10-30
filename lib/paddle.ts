import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const PLAN_KEYS = ["plus_monthly", "plus_annual", "founder_lifetime"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

export const EXPECTED_PLAN_PRICES: Record<PlanKey, { amount: string; currency: "USD"; interval: "month" | "year" | null }> = {
  plus_monthly: { amount: "499", currency: "USD", interval: "month" },
  plus_annual: { amount: "1999", currency: "USD", interval: "year" },
  founder_lifetime: { amount: "3999", currency: "USD", interval: null },
};

const PRICE_ENV_NAMES: Record<PlanKey, string> = {
  plus_monthly: "PADDLE_PRICE_PLUS_MONTHLY",
  plus_annual: "PADDLE_PRICE_PLUS_ANNUAL",
  founder_lifetime: "PADDLE_PRICE_FOUNDER_LIFETIME",
};

export function paddleBaseUrl() {
  return process.env.PADDLE_ENV === "production" ? "https://api.paddle.com" : "https://sandbox-api.paddle.com";
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

export async function paddleRequest<T>(path: string, init: RequestInit = {}) {
  const apiKey = process.env.PADDLE_API_KEY;
  if (!apiKey) throw new Error("PADDLE_API_KEY is not configured");
  const response = await fetch(`${paddleBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const body = (await response.json().catch(() => ({}))) as T & { error?: { detail?: string } };
  if (!response.ok) throw new Error(body.error?.detail || `paddle_request_failed_${response.status}`);
  return body;
}

type PaddlePriceResponse = {
  data: {
    id: string;
    status: string;
    unit_price: { amount: string; currency_code: string };
    billing_cycle: { interval: string; frequency: number } | null;
  };
};

export async function validatedPriceForPlan(plan: PlanKey) {
  const priceId = priceIdForPlan(plan);
  const result = await paddleRequest<PaddlePriceResponse>(`/prices/${encodeURIComponent(priceId)}`);
  const expected = EXPECTED_PLAN_PRICES[plan];
  const interval = result.data.billing_cycle?.interval || null;
  const frequency = result.data.billing_cycle?.frequency || null;
  if (
    result.data.status !== "active"
    || result.data.unit_price.amount !== expected.amount
    || result.data.unit_price.currency_code !== expected.currency
    || interval !== expected.interval
    || (expected.interval !== null && frequency !== 1)
  ) {
    throw new Error("billing_price_mismatch");
  }
  return { priceId, amount: expected.amount, currency: expected.currency, interval: expected.interval };
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function verifyPaddleSignature(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;
  const parts = Object.fromEntries(signatureHeader.split(";").map((part) => part.split("=", 2)));
  const timestamp = parts.ts;
  const signature = parts.h1;
  if (!timestamp || !signature || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}:${rawBody}`).digest();
  const received = Buffer.from(signature, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}
