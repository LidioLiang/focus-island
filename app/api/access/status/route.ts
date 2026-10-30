import { cookies } from "next/headers";
import { ACCESS_COOKIE_NAME, AccessStatus, createAccessSnapshot, deniedAccess, verifyAccessSnapshot } from "@/lib/access";
import { authenticatedSupabase, json } from "@/lib/presence";
import { isDeveloper } from "@/lib/authorization";

export const dynamic = "force-dynamic";

function normalize(value: Record<string, unknown>, developer: boolean): AccessStatus {
  return {
    authenticated: value.authenticated === true,
    emailVerified: value.emailVerified === true,
    accountType: value.accountType === "permanent" ? "permanent" : "anonymous",
    trialStatus: (value.trialStatus as AccessStatus["trialStatus"]) || "unavailable",
    entitlementType: (value.entitlementType as AccessStatus["entitlementType"]) || "none",
    subscriptionStatus: typeof value.subscriptionStatus === "string" ? value.subscriptionStatus : null,
    canEnterProduct: value.canEnterProduct === true,
    canStartFocus: value.canStartFocus === true,
    offlineGraceUntil: null,
    paywallReason: typeof value.paywallReason === "string" ? value.paywallReason : null,
    developer,
  };
}

export async function GET() {
  const auth = await authenticatedSupabase();
  if (!auth) return json(deniedAccess(), { status: 401, headers: { "Cache-Control": "no-store" } });
  const { data, error } = await auth.supabase.rpc("get_my_access_status");
  if (!error && data && typeof data === "object") {
    const status = normalize(data as Record<string, unknown>, isDeveloper(auth.user));
    let snapshot: ReturnType<typeof createAccessSnapshot> | null = null;
    if (["subscription", "lifetime", "admin"].includes(status.entitlementType)) {
      snapshot = createAccessSnapshot(auth.user.id, status.entitlementType as "subscription" | "lifetime" | "admin");
      status.offlineGraceUntil = snapshot.expiresAt.toISOString();
    }
    const response = json(status, { headers: { "Cache-Control": "no-store" } });
    if (snapshot) {
      response.cookies.set(ACCESS_COOKIE_NAME, snapshot.value, {
        httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
        path: "/", expires: snapshot.expiresAt,
      });
    } else {
      response.cookies.delete(ACCESS_COOKIE_NAME);
    }
    return response;
  }

  const cookieStore = await cookies();
  const snapshot = verifyAccessSnapshot(cookieStore.get(ACCESS_COOKIE_NAME)?.value, auth.user.id);
  if (snapshot && !auth.user.is_anonymous && auth.user.email_confirmed_at) {
    return json({
      authenticated: true, emailVerified: true, accountType: "permanent", trialStatus: "unavailable",
      entitlementType: "offline_grace", subscriptionStatus: "grace", canEnterProduct: true,
      canStartFocus: true, offlineGraceUntil: new Date(snapshot.expiresAt * 1000).toISOString(), paywallReason: null,
      developer: isDeveloper(auth.user),
    } satisfies AccessStatus, { headers: { "Cache-Control": "no-store", "X-Access-Source": "signed-offline-grace" } });
  }
  return json({ ...deniedAccess("access_service_unavailable"), authenticated: true }, { status: 503, headers: { "Cache-Control": "no-store" } });
}
