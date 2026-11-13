import { z } from "zod";
import { emailSchema } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { json } from "@/lib/presence";
import { rateLimited } from "@/lib/security";

const schema = z.object({ email: emailSchema, captchaToken: z.string().max(4096).default("") });

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ error: "invalid_origin" }, { status: 403 });
  if (rateLimited(request, "password-reset", 5, 30 * 60_000)) return json({ error: "rate_limited" }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_request" }, { status: 400 });
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    captchaToken: parsed.data.captchaToken || undefined,
    redirectTo: `${new URL(request.url).origin}/?auth=reset-password`,
  });
  if (error) return json({ error: error.status === 429 ? "rate_limited" : "auth_service_unavailable" }, { status: error.status === 429 ? 429 : 503 });
  return json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
