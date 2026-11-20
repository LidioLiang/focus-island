import "server-only";
import { AppStoreServerAPIClient, Environment, SignedDataVerifier } from "@apple/app-store-server-library";
import { appleEntitlement } from "@/lib/apple-entitlement";

export const APPLE_PRODUCTS = ["online.focusisle.plus.monthly", "online.focusisle.plus.annual"] as const;
export function appleStore() {
  if (process.env.APPLE_IAP_ENABLED !== "true") throw new Error("apple_billing_unavailable");
  const required = (name: string) => { const value = process.env[name]; if (!value) throw new Error("apple_billing_unavailable"); return value; };
  const environment = required("APPLE_IAP_ENVIRONMENT");
  if (environment !== "Production" && environment !== "Sandbox") throw new Error("apple_billing_unavailable");
  const appleId = Number(required("APPLE_APP_ID"));
  if (!Number.isSafeInteger(appleId) || appleId <= 0) throw new Error("apple_billing_unavailable");
  const bundle = "online.focusisle.app";
  const roots = required("APPLE_ROOT_CERTIFICATES_BASE64").split(",").map(value => Buffer.from(value.trim(), "base64"));
  const env = environment === "Production" ? Environment.PRODUCTION : Environment.SANDBOX;
  const verifier = new SignedDataVerifier(roots, true, env, bundle, appleId);
  const api = new AppStoreServerAPIClient(required("APPLE_IAP_PRIVATE_KEY").replaceAll("\\n", "\n"),
    required("APPLE_IAP_KEY_ID"), required("APPLE_IAP_ISSUER_ID"), bundle, env);
  return { environment, verifier, api };
}

export async function verifyAppleSubscription(jws: string, owner: string) {
  const store = appleStore();
  const supplied = await store.verifier.verifyAndDecodeTransaction(jws);
  appleEntitlement(supplied, 1, owner, APPLE_PRODUCTS); // Identity/product checks before any server lookup.
  const response = await store.api.getAllSubscriptionStatuses(supplied.originalTransactionId!);
  const item = response.data?.flatMap(group => group.lastTransactions || [])
    .find(transaction => transaction.originalTransactionId === supplied.originalTransactionId);
  if (!item?.signedTransactionInfo || item.status == null) throw new Error("subscription_status_unavailable");
  const current = await store.verifier.verifyAndDecodeTransaction(item.signedTransactionInfo);
  if (current.originalTransactionId !== supplied.originalTransactionId) throw new Error("invalid_transaction");
  const renewal = item.signedRenewalInfo ? await store.verifier.verifyAndDecodeRenewalInfo(item.signedRenewalInfo) : null;
  if (renewal && renewal.originalTransactionId !== current.originalTransactionId) throw new Error("invalid_transaction");
  return { ...appleEntitlement(current, item.status, owner, APPLE_PRODUCTS, renewal?.gracePeriodExpiresDate), environment: store.environment };
}
