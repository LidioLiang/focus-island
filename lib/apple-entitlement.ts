// Pure policy, called only after Apple signature verification and a fresh Server API lookup.
export type AppleSubscription = {
  originalTransactionId?: string; transactionId?: string; productId?: string;
  appAccountToken?: string; expiresDate?: number; revocationDate?: number;
  isUpgraded?: boolean; signedDate?: number; purchaseDate?: number;
};
export function appleEntitlement(transaction: AppleSubscription, status: number, owner: string,
  products: readonly string[], graceExpires?: number, now = Date.now()) {
  if (!transaction.appAccountToken || transaction.appAccountToken.toLowerCase() !== owner.toLowerCase()) throw new Error("purchase_account_mismatch");
  if (!transaction.productId || !products.includes(transaction.productId)) throw new Error("unknown_product");
  if (!transaction.originalTransactionId || !transaction.transactionId || !transaction.expiresDate || !transaction.signedDate) throw new Error("invalid_transaction");
  const expires = status === 4 && graceExpires ? graceExpires : transaction.expiresDate;
  return { userId: owner, originalTransactionId: transaction.originalTransactionId, transactionId: transaction.transactionId,
    productId: transaction.productId, expiresAt: new Date(expires).toISOString(), signedAt: new Date(transaction.signedDate).toISOString(),
    active: (status === 1 || status === 4) && transaction.revocationDate == null && !transaction.isUpgraded && expires > now };
}
