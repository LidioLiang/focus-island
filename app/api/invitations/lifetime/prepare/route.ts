import { z } from "zod";
import { LIFETIME_INVITE_COOKIE } from "@/lib/invitations";
import { json } from "@/lib/presence";
import { rateLimited } from "@/lib/security";

const schema = z.object({ token: z.string().min(24).max(160).regex(/^[A-Za-z0-9_-]+$/) });

export async function POST(request: Request) {
  if (rateLimited(request, "lifetime-invite-prepare", 20, 15 * 60_000)) return json({ error: "rate_limited" }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_invitation" }, { status: 400 });
  const response = json({ ok: true });
  response.cookies.set(LIFETIME_INVITE_COOKIE, parsed.data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  return response;
}
