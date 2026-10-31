import { z } from "zod";
import { emailSchema, passwordSchema, authError } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { json } from "@/lib/presence";
import { rateLimited } from "@/lib/security";
import { isDeveloper } from "@/lib/authorization";

const schema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1).max(128),
  captchaToken: z.string().max(4096).default(""),
});

export async function POST(request: Request) {
  if (rateLimited(request, "sign-up", 5, 15 * 60_000)) return json({ error: "rate_limited" }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_registration", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  if (parsed.data.password !== parsed.data.confirmPassword) return json({ error: "password_mismatch" }, { status: 400 });
  if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !parsed.data.captchaToken) return json({ error: "captcha_required" }, { status: 403 });

  const supabase = await createServerSupabaseClient();
  const { data: current } = await supabase.auth.getUser();
  if (current.user?.is_anonymous) {
    await supabase.auth.signOut();
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      captchaToken: parsed.data.captchaToken || undefined,
    },
  });
  if (error) return json({ error: authError(error, "sign_up_failed") }, { status: 400 });
  if (!data.user || !data.session) return json({ error: "registration_session_unavailable" }, { status: 503 });
  const { error: accessError } = await supabase.rpc("get_my_access_status");
  if (accessError?.message.includes("closed_beta_full")) {
    await supabase.auth.signOut();
    return json({ error: "closed_beta_full" }, { status: 403 });
  }
  if (accessError) return json({ error: "access_service_unavailable" }, { status: 503 });
  return json({
    ok: true,
    userId: data.user.id,
    email: data.user.email,
    developer: isDeveloper(data.user),
  });
}
