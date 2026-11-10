import { randomBytes } from "node:crypto";
import { z } from "zod";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { appOrigin, enabledProviders, SOCIAL_PROVIDERS } from "@/lib/auth-providers";
import { activeAccountSession } from "@/lib/profile";
import { sha256 } from "@/lib/crypto";
import { json } from "@/lib/presence";
import { rateLimited } from "@/lib/security";
const schema = z.object({ provider: z.enum(SOCIAL_PROVIDERS) });
export async function POST(request: Request) {
  if (rateLimited(request, "oauth-start", 10, 60_000)) return json({ error: "rate_limited" }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_provider" }, { status: 400 });
  // Same-origin initiation, PKCE verifier in cookies, fixed callback and no user-supplied redirect.
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ error: "invalid_origin" }, { status: 403 });
  try {
    if (!(await enabledProviders())[parsed.data.provider]) return json({ error: "provider_unavailable" }, { status: 503 });
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (await activeAccountSession(supabase, user)) return json({ error: "active_session_exists" }, { status: 409 });
    const cookieStore = await cookies();
    const token = randomBytes(32).toString("base64url");
    if (user?.is_anonymous) {
      const { error } = await createAdminSupabaseClient().from("account_merge_requests").insert({ anonymous_user_id: user.id, token_hash: sha256(token), expires_at: new Date(Date.now()+30*60_000).toISOString() });
      if (error) return json({ error: "merge_prepare_failed" }, { status: 503 });
      cookieStore.set("focus-oauth-merge", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/auth/callback", maxAge: 1800 });
    } else cookieStore.delete("focus-oauth-merge");
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: parsed.data.provider, options: { redirectTo: `${appOrigin(request)}/auth/callback`, skipBrowserRedirect: true } });
    if (error || !data.url) return json({ error: "oauth_start_failed" }, { status: 503 });
    return json({ url: data.url }, { headers: { "Cache-Control": "no-store" } });
  } catch { return json({ error: "auth_service_unavailable" }, { status: 503 }); }
}
