import test from "node:test";
import assert from "node:assert/strict";
import { appleEntitlement } from "../lib/apple-entitlement.ts";
const now = 1_800_000_000_000;
const transaction = { originalTransactionId: "original", transactionId: "latest", productId: "monthly", appAccountToken: "account-a", expiresDate: now + 10_000, signedDate: now };
const check = (patch = {}, status = 1, grace?: number) => appleEntitlement({ ...transaction, ...patch }, status, "account-a", ["monthly"], grace, now);
test("only the purchasing app account can receive the entitlement", () => {
  assert.equal(check().active, true);
  assert.throws(() => check({ appAccountToken: "account-b" }), /purchase_account_mismatch/);
  assert.throws(() => check({ appAccountToken: undefined }), /purchase_account_mismatch/);
  assert.throws(() => check({ productId: "unknown" }), /unknown_product/);
});
test("expired, refunded, upgraded and billing retry purchases do not grant access", () => {
  for (const status of [2, 3, 5, 99]) assert.equal(check({}, status).active, false);
  assert.equal(check({ expiresDate: now }).active, false);
  assert.equal(check({ revocationDate: now }).active, false);
  assert.equal(check({ isUpgraded: true }).active, false);
});
test("billing grace is limited to the verified grace expiration", () => {
  assert.equal(check({ expiresDate: now - 10 }, 4, now + 10).active, true);
  assert.equal(check({ expiresDate: now - 10 }, 4, now - 1).active, false);
  assert.equal(check({ expiresDate: now - 10 }, 4).active, false);
});
