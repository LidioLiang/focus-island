import { NextRequest } from "next/server";

const buckets = new Map<string, { count: number; resetAt: number }>();

export function clientIp(request: NextRequest | Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export function rateLimited(request: NextRequest | Request, scope: string, limit = 60, windowMs = 60_000) {
  const key = `${scope}:${clientIp(request)}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}
