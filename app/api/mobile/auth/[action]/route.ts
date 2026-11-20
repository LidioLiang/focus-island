import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { authError, emailSchema, passwordSchema } from "@/lib/auth";
import { authenticatedSupabase, json } from "@/lib/presence";
import { activeAccountSession } from "@/lib/profile";
import { rateLimited } from "@/lib/security";

const captcha = z.string().max(4096).default("");
const schemas = {
  "sign-in": z.object({ email: emailSchema, password: z.string().min(1).max(128), captchaToken: captcha }),
  "sign-up": z.object({ email: emailSchema, password: passwordSchema, confirmPassword: z.string(), captchaToken: captcha }).refine(v => v.password === v.confirmPassword),
  anonymous: z.object({ displayName: z.string().trim().min(1).max(24), avatarSkin: z.number().int().min(0).max(3), captchaToken: captcha }),
  refresh: z.object({ refreshToken: z.string().min(1).max(8192) }),
};

// Only the native networking layer consumes this response and stores the tokens in Keychain.
// Disabled until the native release and Auth provider configuration have passed integration tests.
export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  const reply = (data: unknown, status = 200) => json(data, { status, headers: { "Cache-Control": "no-store", "Pragma": "no-cache" } });
  if (process.env.MOBILE_AUTH_ENABLED !== "true") return reply({ error: "mobile_auth_unavailable" }, 503);
  const { action } = await context.params;
  if (!Object.hasOwn(schemas, action) && action !== "sign-out") return reply({ error: "not_found" }, 404);
  if (rateLimited(request, `mobile-${action}`, action === "refresh" ? 60 : 8, 60_000)) return reply({ error: "rate_limited" }, 429);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return reply({ error: "auth_service_unavailable" }, 503);
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  if (action === "sign-out") {
    const current = await authenticatedSupabase();
    if (current && await activeAccountSession(current.supabase, current.user)) return reply({ error: "active_session_exists" }, 409);
    // The native client supplies its refresh and access token privately, never through JS.
    const body = z.object({ accessToken: z.string().min(1).max(8192), refreshToken: z.string().min(1).max(8192) }).safeParse(await request.json().catch(() => null));
    if (!body.success) return reply({ error: "invalid_request" }, 400);
    const { error } = await client.auth.setSession({ access_token: body.data.accessToken, refresh_token: body.data.refreshToken });
    if (error) return reply({ error: "authentication_required" }, 401);
    const result = await client.auth.signOut({ scope: "local" });
    return result.error ? reply({ error: "sign_out_failed" }, 503) : reply({ ok: true });
  }
  const parsed = schemas[action as keyof typeof schemas].safeParse(await request.json().catch(() => null));
  if (!parsed.success) return reply({ error: "invalid_request" }, 400);
  const values = parsed.data;
  if (action !== "refresh") {
    const existing = await authenticatedSupabase();
    if (request.headers.has("authorization") && !existing) return reply({ error: "authentication_required" }, 401);
    if (existing && await activeAccountSession(existing.supabase, existing.user)) return reply({ error: "active_session_exists" }, 409);
    if (action === "anonymous" && existing) return reply({ error: "identity_already_exists" }, 409);
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && "captchaToken" in values && !values.captchaToken) return reply({ error: "captcha_required" }, 403);
  }
  const options = { captchaToken: "captchaToken" in values ? values.captchaToken || undefined : undefined };
  const result = "refreshToken" in values
    ? await client.auth.refreshSession({ refresh_token: values.refreshToken })
    : action === "anonymous"
      ? await client.auth.signInAnonymously({ options })
      : "email" in values && action === "sign-up"
        ? await client.auth.signUp({ email: values.email, password: values.password, options })
        : "email" in values
          ? await client.auth.signInWithPassword({ email: values.email, password: values.password, options })
          : null;
  if (!result || result.error) return reply({ error: authError(result?.error || null) }, 401);
  const { session, user } = result.data;
  if (!session || !user) return reply({ error: "email_confirmation_required" }, 409);
  return reply({ ok: true, userId: user.id, anonymous: user.is_anonymous === true,
    session: { accessToken: session.access_token, refreshToken: session.refresh_token, expiresAt: session.expires_at, userId: user.id } });
}
