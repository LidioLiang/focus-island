import { EXPECTED_PLAN_PRICES, PLAN_KEYS, validatedPriceForPlan } from "@/lib/paddle";
import { json } from "@/lib/presence";

export const dynamic = "force-dynamic";

export async function GET() {
  const plans = await Promise.all(PLAN_KEYS.map(async (plan) => {
    try {
      const price = await validatedPriceForPlan(plan);
      return { key: plan, ...price, configured: true };
    } catch (error) {
      const expected = EXPECTED_PLAN_PRICES[plan];
      return {
        key: plan,
        amount: expected.amount,
        currency: expected.currency,
        interval: expected.interval,
        configured: false,
        unavailableReason: error instanceof Error ? error.message : "billing_unavailable",
      };
    }
  }));
  return json({ plans }, { headers: { "Cache-Control": "public, max-age=0, s-maxage=300" } });
}
