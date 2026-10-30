import { z } from "zod";
import { emailSchema, authError } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { json } from "@/lib/presence";
import { rateLimited } from "@/lib/security";
import { isDeveloper } from "@/lib/authorization";

const schema = z.object({ email: emailSchema, password: z.string().min(1).max(128), captchaToken: z.string().max(4096).default("") });

export async function POST(request: Request) {
  if (rateLimited(request, "sign-in", 10, 15 * 60_000)) return json({ error: "rate_limited" }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_credentials" }, { status: 400 });
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password, options: { captchaToken: parsed.data.captchaToken || undefined } });
  if (error || !data.user) return json({ error: authError(error) }, { status: 401 });
  if (!data.user.email_confirmed_at) return json({ error: "email_verification_required" }, { status: 403 });
  return json({ ok: true, userId: data.user.id, email: data.user.email, developer: isDeveloper(data.user) });
}
