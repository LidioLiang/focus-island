export const RECOVERY_COOKIE = 'focus-password-recovery';
export const RECOVERY_SECONDS = 600;
// Only verified JWT claims may be passed here. PKCE redirectType is client-derived.
export function recoverySession(claims: Record<string, unknown>, userId: string, now = Date.now()) {
  if (claims.sub !== userId || claims.is_anonymous === true || typeof claims.session_id !== 'string') return null;
  const methods = Array.isArray(claims.amr) ? claims.amr : [];
  const fresh = methods.some((item: { method?: string; timestamp?: number }) => item.method === 'recovery' && typeof item.timestamp === 'number' && item.timestamp * 1000 <= now + 30000 && now - item.timestamp * 1000 <= RECOVERY_SECONDS * 1000);
  return fresh ? claims.session_id : null;
}
