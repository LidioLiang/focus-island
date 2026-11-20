// Presence of an invalid Authorization header must never fall back to browser cookies.
export function bearerToken(header: string | null): string | null {
  if (header === null) return null;
  const match = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(header);
  if (!match || match[0] !== header || header.length > 8192) throw new Error("invalid_authorization");
  return match[1];
}
