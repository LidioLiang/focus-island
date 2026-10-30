import { z } from "zod";
import { emailSchema, authError } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { json } from "@/lib/presence";
import { rateLimited } from "@/lib/security";

const schema = z.object({
  email: emailSchema,
  token: z.string().trim().min(6).max(128),
  flow: z.enum(["new_account", "anonymous_upgrade"]).default("new_account"),
  displayName: z.string().trim().min(1).max(24).default("岛上旅人"),
  avatarSkin: z.number().int().min(0).max(3).default(0),
});

export async function POST(request: Request) {
  if (rateLimited(request, "verify-email", 10, 15 * 60_000)) return json({ error: "rate_limited" }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_verification" }, { status: 400 });
  const supabase = await createServerSupabaseClient();
  const type = parsed.data.flow === "anonymous_upgrade" ? "email_change" : "signup";
  const { data, error } = await supabase.auth.verifyOtp({ email: parsed.data.email, token: parsed.data.token, type });
  if (error || !data.user) return json({ error: authError(error, "verification_failed") }, { status: 400 });
  const { error: profileError } = await supabase.rpc("upsert_my_profile", {
    p_display_name: parsed.data.displayName,
    p_avatar_skin: parsed.data.avatarSkin,
  });
  if (profileError) return json({ error: "profile_sync_failed" }, { status: 503 });
  const { error: accessError } = await supabase.rpc("get_my_access_status");
  if (accessError?.message.includes("closed_beta_full")) {
    await supabase.auth.signOut();
    return json({ error: "closed_beta_full" }, { status: 403 });
  }
  if (accessError) return json({ error: "access_service_unavailable" }, { status: 503 });
  return json({ ok: true, userId: data.user.id, requiresPassword: data.user.is_anonymous === true });
}
