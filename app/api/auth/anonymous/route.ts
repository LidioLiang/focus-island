import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { rateLimited } from "@/lib/security";
import { json } from "@/lib/presence";

const schema = z.object({
  captchaToken: z.string().max(4096).default(""),
  displayName: z.string().trim().min(1).max(24),
  avatarSkin: z.number().int().min(0).max(3),
});

export async function POST(request: Request) {
  if (process.env.ALLOW_ANONYMOUS_MIGRATION !== "true") {
    return json({ error: "anonymous_sign_in_disabled", upgradeRequired: true }, { status: 410 });
  }
  if (rateLimited(request, "anonymous-auth", 8, 10 * 60_000)) return json({ error: "rate_limited" }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_request" }, { status: 400 });
  const supabase = await createServerSupabaseClient();
  const { data: current } = await supabase.auth.getUser();
  let user = current.user;
  if (!user) {
    if (process.env.NODE_ENV === "production" && !parsed.data.captchaToken) return json({ error: "captcha_required" }, { status: 403 });
    const { data, error } = await supabase.auth.signInAnonymously({ options: { captchaToken: parsed.data.captchaToken || undefined } });
    if (error || !data.user) return json({ error: "anonymous_sign_in_failed" }, { status: 503 });
    user = data.user;
  }
  const { error: profileError } = await supabase.rpc("upsert_my_profile", { p_display_name: parsed.data.displayName, p_avatar_skin: parsed.data.avatarSkin });
  if (profileError) return json({ error: "profile_sync_failed" }, { status: 503 });
  return json({ ok: true, userId: user.id, anonymous: user.is_anonymous === true });
}
