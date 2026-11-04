import { z } from "zod";
import { emailSchema } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { json } from "@/lib/presence";
import { rateLimited } from "@/lib/security";

const schema = z.object({ email: emailSchema, captchaToken: z.string().max(4096).default("") });

export async function POST(request: Request) {
  if (rateLimited(request, "password-reset", 5, 30 * 60_000)) return json({ error: "rate_limited" }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_request" }, { status: 400 });
  const supabase = await createServerSupabaseClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    captchaToken: parsed.data.captchaToken || undefined,
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin}/?auth=reset-password`,
  });
  return json({ ok: true });
}
