import { z } from "zod";
import { emailSchema, passwordSchema, authError } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { json } from "@/lib/presence";
import { rateLimited } from "@/lib/security";

const schema = z.object({
  email: emailSchema,
  password: passwordSchema,
  captchaToken: z.string().max(4096).default(""),
});

export async function POST(request: Request) {
  if (rateLimited(request, "sign-up", 5, 15 * 60_000)) return json({ error: "rate_limited" }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_registration", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  if (process.env.NODE_ENV === "production" && !parsed.data.captchaToken) return json({ error: "captcha_required" }, { status: 403 });

  const supabase = await createServerSupabaseClient();
  const { data: current } = await supabase.auth.getUser();
  if (current.user?.is_anonymous) {
    const { error } = await supabase.auth.updateUser({ email: parsed.data.email }, { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin}/?auth=verified` });
    if (error) return json({ error: authError(error, "anonymous_upgrade_failed") }, { status: 400 });
    return json({ ok: true, flow: "anonymous_upgrade", requiresEmailVerification: true, requiresPasswordAfterVerification: true });
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      captchaToken: parsed.data.captchaToken || undefined,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin}/?auth=verified`,
    },
  });
  if (error) return json({ error: authError(error, "sign_up_failed") }, { status: 400 });
  return json({ ok: true, flow: "new_account", requiresEmailVerification: !data.session, email: parsed.data.email });
}
