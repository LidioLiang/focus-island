import { z } from "zod";
import { authenticatedSupabase, json } from "@/lib/presence";
import { readProfile, providerPhotos } from "@/lib/profile";
import { rateLimited } from "@/lib/security";

export async function GET(request: Request) {
  const auth = await authenticatedSupabase();
  if (!auth) return json({ error: "authentication_required" }, { status: 401 });
  if (request.headers.get("X-Focus-User") !== auth.user.id) return json({ error: "identity_changed" }, { status: 409 });
  try {
    return json({ userId: auth.user.id, profile: await readProfile(auth.supabase, auth.user), anonymous: auth.user.is_anonymous === true, email: auth.user.email || null, providers: auth.user.identities?.map(i => i.provider) || [], providerPhotos: providerPhotos(auth.user) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return json({ error: "profile_unavailable" }, { status: 503 }); }
}

const schema = z.object({ displayName: z.string().trim().min(1).max(24), avatarSkin: z.number().int().min(0).max(3), avatarSource: z.enum(["builtin", "upload", "google", "github"]), avatarUrl: z.string().max(2048).nullable().optional() });
export async function PATCH(request: Request) {
  if (rateLimited(request, "profile-update", 30, 60_000)) return json({ error: "rate_limited" }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_profile" }, { status: 400 });
  const auth = await authenticatedSupabase();
  if (!auth) return json({ error: "authentication_required" }, { status: 401 });
  if (request.headers.get("X-Focus-User") !== auth.user.id) return json({ error: "identity_changed" }, { status: 409 });
  try {
    const current = await readProfile(auth.supabase, auth.user);
    const input = parsed.data;
    const url = input.avatarSource === "builtin" ? null : input.avatarSource === "upload" ? current.avatarSource === "upload" ? current.avatarUrl : null : providerPhotos(auth.user).find(p => p.provider === input.avatarSource)?.url;
    if (input.avatarSource !== "builtin" && !url) return json({ error: "avatar_unavailable" }, { status: 400 });
    const { error } = await auth.supabase.rpc("set_my_profile", { p_display_name: input.displayName, p_avatar_skin: input.avatarSkin, p_avatar_url: url, p_avatar_source: input.avatarSource });
    if (error) return json({ error: "profile_save_failed" }, { status: 503 });
    return json({ userId: auth.user.id, profile: await readProfile(auth.supabase, auth.user) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return json({ error: "profile_unavailable" }, { status: 503 }); }
}
