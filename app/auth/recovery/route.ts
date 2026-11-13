import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { sha256 } from '@/lib/crypto';
import { RECOVERY_COOKIE, RECOVERY_SECONDS, recoverySession } from '@/lib/password-recovery';
export async function GET(request: Request) {
  const url = new URL(request.url), destination = new URL('/', url.origin);
  const cookieStore = await cookies();
  cookieStore.set(RECOVERY_COOKIE, '', { path: '/api/auth/password/recover', maxAge: 0 });
  try {
    const code = url.searchParams.get('code');
    if (!code || url.searchParams.has('error')) throw new Error('invalid');
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code, { flowId: url.searchParams.get('sb_flow_id') || undefined });
    if (error || !data.user || !data.session || data.user.is_anonymous) throw new Error('invalid');
    const verified = await supabase.auth.getClaims(data.session.access_token);
    const sessionId = !verified.error && verified.data ? recoverySession(verified.data.claims, data.user.id) : null;
    if (!sessionId) throw new Error('invalid');
    const token = randomBytes(32).toString('hex');
    const admin = createAdminSupabaseClient();
    const { error: grantError } = await admin.from('password_recovery_grants').insert({ token_hash: sha256(token), user_id: data.user.id, session_id: sessionId, expires_at: new Date(Date.now() + RECOVERY_SECONDS * 1000).toISOString() });
    if (grantError) throw new Error('unavailable');
    cookieStore.set(RECOVERY_COOKIE, token, { httpOnly: true, secure: url.protocol === 'https:', sameSite: 'lax', path: '/api/auth/password/recover', maxAge: RECOVERY_SECONDS });
    destination.searchParams.set('account', 'reset-password');
  } catch { destination.searchParams.set('account-error', 'verification_expired'); }
  const response = NextResponse.redirect(destination);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
