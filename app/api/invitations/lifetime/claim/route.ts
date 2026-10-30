import { cookies } from "next/headers";
import { LIFETIME_INVITE_COOKIE, lifetimeInviteHash } from "@/lib/invitations";
import { authenticatedSupabase, json } from "@/lib/presence";
import { rateLimited } from "@/lib/security";

function statusFor(message: string) {
  if (message.includes("invitation_exhausted")) return 409;
  if (message.includes("invalid_invitation")) return 404;
  if (message.includes("email_verification_required")) return 403;
  return 400;
}

export async function POST(request: Request) {
  if (rateLimited(request, "lifetime-invite-claim", 10, 15 * 60_000)) return json({ error: "rate_limited" }, { status: 429 });
  const auth = await authenticatedSupabase();
  if (!auth || auth.user.is_anonymous) return json({ error: "registration_required" }, { status: 401 });
  if (!auth.user.email_confirmed_at) return json({ error: "email_verification_required" }, { status: 403 });
  const cookieStore = await cookies();
  const token = cookieStore.get(LIFETIME_INVITE_COOKIE)?.value;
  if (!token) return json({ error: "invitation_missing" }, { status: 404 });
  const { data, error } = await auth.supabase.rpc("claim_my_lifetime_invite", { p_token_hash: lifetimeInviteHash(token) });
  if (error) {
    const known = ["invitation_exhausted", "invalid_invitation", "email_verification_required"];
    const code = known.find((item) => error.message.includes(item)) || "invitation_claim_failed";
    return json({ error: code }, { status: statusFor(error.message) });
  }
  const response = json(data, { headers: { "Cache-Control": "no-store" } });
  response.cookies.delete(LIFETIME_INVITE_COOKIE);
  return response;
}
