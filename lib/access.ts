import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

export const ACCESS_COOKIE_NAME = "focus_island_access";
export const ACCESS_GRACE_SECONDS = 72 * 60 * 60;

export type TrialStatus = "available" | "in_progress" | "consumed" | "unavailable";
export type EntitlementType = "none" | "subscription" | "lifetime" | "admin" | "offline_grace";

export type AccessStatus = {
  authenticated: boolean;
  emailVerified: boolean;
  accountType?: "anonymous" | "permanent";
  trialStatus: TrialStatus;
  entitlementType: EntitlementType;
  subscriptionStatus: string | null;
  canEnterProduct: boolean;
  canStartFocus: boolean;
  offlineGraceUntil: string | null;
  paywallReason: string | null;
  developer: boolean;
};

type AccessSnapshot = {
  userId: string;
  entitlementType: Exclude<EntitlementType, "none" | "offline_grace">;
  expiresAt: number;
};

function secret() {
  const value = process.env.ENTITLEMENT_COOKIE_SECRET;
  if (!value || value.length < 32) throw new Error("ENTITLEMENT_COOKIE_SECRET must contain at least 32 characters");
  return value;
}

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function createAccessSnapshot(userId: string, entitlementType: AccessSnapshot["entitlementType"]) {
  const payload: AccessSnapshot = {
    userId,
    entitlementType,
    expiresAt: Math.floor(Date.now() / 1000) + ACCESS_GRACE_SECONDS,
  };
  const encoded = encode(JSON.stringify(payload));
  const signature = createHmac("sha256", secret()).update(encoded).digest("base64url");
  return { value: `${encoded}.${signature}`, expiresAt: new Date(payload.expiresAt * 1000) };
}

export function verifyAccessSnapshot(value: string | undefined, userId: string): AccessSnapshot | null {
  if (!value) return null;
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return null;
  const expected = createHmac("sha256", secret()).update(encoded).digest();
  const received = Buffer.from(signature, "base64url");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const payload = JSON.parse(decode(encoded)) as AccessSnapshot;
    if (payload.userId !== userId || payload.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    if (!new Set(["subscription", "lifetime", "admin"]).has(payload.entitlementType)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function deniedAccess(paywallReason = "authentication_required"): AccessStatus {
  return {
    authenticated: false,
    emailVerified: false,
    trialStatus: "unavailable",
    entitlementType: "none",
    subscriptionStatus: null,
    canEnterProduct: false,
    canStartFocus: false,
    offlineGraceUntil: null,
    paywallReason,
    developer: false,
  };
}
