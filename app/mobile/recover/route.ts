import { randomBytes, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sha256 } from '@/lib/crypto';
import { RECOVERY_COOKIE, RECOVERY_SECONDS, recoverySession } from '@/lib/password-recovery';
import { rateLimited } from '@/lib/security';
import { json } from '@/lib/presence';

// Native recovery emails use implicit Auth links; only this isolated browser page reads the fragment.
// Tokens are never placed in query parameters, analytics, localStorage, or the native web view.
export async function GET() {
  const nonce = randomUUID();
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reset your password · Focus Isle</title><style>body{font:17px system-ui;color:#203e54;background:#f4f8fb;margin:40px auto;padding:24px;max-width:560px;line-height:1.6}</style></head><body><h1>Reset your password</h1><p id="status" role="status">Checking your recovery link…</p><script nonce="${nonce}">(async()=>{const params=new URLSearchParams(location.hash.slice(1));history.replaceState(null,'','/mobile/recover');try{if(params.get('type')!=='recovery')throw Error();const response=await fetch('/mobile/recover',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accessToken:params.get('access_token'),refreshToken:params.get('refresh_token')})});if(!response.ok)throw Error();location.replace('/app?account=reset-password');}catch{document.getElementById('status').textContent='This recovery link is invalid or expired. Return to the app and request a new link.';}})();</script></body></html>`, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow', 'Content-Security-Policy': `default-src 'none'; script-src 'nonce-${nonce}'; connect-src 'self'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'` } });
}
export async function POST(request: Request) {
  const fail = () => json({ error: 'verification_expired' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  if (process.env.MOBILE_AUTH_ENABLED !== 'true' || request.headers.get('origin') !== new URL(request.url).origin) return fail();
  if (rateLimited(request, 'mobile-recovery', 5)) return json({ error: 'rate_limited' }, { status: 429 });
  const parsed = z.object({ accessToken: z.string().min(1).max(8192), refreshToken: z.string().min(1).max(8192) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail();
  try {
    const verifier = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
    const [{ data: userData, error: userError }, verified] = await Promise.all([verifier.auth.getUser(parsed.data.accessToken), verifier.auth.getClaims(parsed.data.accessToken)]);
    const user = userData.user;
    const sessionId = user && !userError && !verified.error && verified.data ? recoverySession(verified.data.claims, user.id) : null;
    if (!user || !sessionId) return fail();
    const server = await createServerSupabaseClient();
    const { data, error } = await server.auth.setSession({ access_token: parsed.data.accessToken, refresh_token: parsed.data.refreshToken });
    if (error || data.user?.id !== user.id || !data.session) return fail();
    const currentClaims = await server.auth.getClaims(data.session.access_token);
    if (currentClaims.error || !currentClaims.data || recoverySession(currentClaims.data.claims, user.id) !== sessionId) return fail();
    const token = randomBytes(32).toString('hex');
    const { error: grantError } = await createAdminSupabaseClient().from('password_recovery_grants').insert({ token_hash: sha256(token), user_id: user.id, session_id: sessionId, expires_at: new Date(Date.now() + RECOVERY_SECONDS * 1000).toISOString() });
    if (grantError) return fail();
    (await cookies()).set(RECOVERY_COOKIE, token, { httpOnly: true, secure: new URL(request.url).protocol === 'https:', sameSite: 'lax', path: '/api/auth/password/recover', maxAge: RECOVERY_SECONDS });
    return json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return fail(); }
}
