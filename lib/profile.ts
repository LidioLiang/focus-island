import type { User, SupabaseClient } from "@supabase/supabase-js";

export function safeAvatarUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    const host = url.hostname;
    if (host.endsWith(".googleusercontent.com") || host === "avatars.githubusercontent.com") return url.href;
    const ownHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://invalid.invalid").hostname;
    if (host === ownHost && url.pathname.startsWith("/storage/v1/object/public/profile-avatars/")) return url.href;
  } catch { /* Invalid or untrusted image URL. */ }
  return null;
}

export function providerPhotos(user: User) {
  const photos: { provider: string; url: string }[] = [];
  for (const identity of user.identities || []) {
    if (!["google", "github"].includes(identity.provider)) continue;
    const url = safeAvatarUrl(identity.identity_data?.avatar_url || identity.identity_data?.picture);
    if (url) photos.push({ provider: identity.provider, url });
  }
  return photos;
}

export async function readProfile(supabase: SupabaseClient, user: User) {
  let { data, error } = await supabase.rpc("get_my_profile");
  if (error) throw new Error("profile_unavailable");
  if (!data) {
    const displayName = String(user.user_metadata?.full_name || user.user_metadata?.name || "Quiet Islander").trim().slice(0, 24) || "Quiet Islander";
    const photo = providerPhotos(user)[0];
    const result = await supabase.rpc("set_my_profile", { p_display_name: displayName, p_avatar_skin: 0, p_avatar_url: photo?.url || null, p_avatar_source: photo?.provider || "builtin" });
    data = result.data; error = result.error;
    if (error) throw new Error("profile_unavailable");
  }
  return { displayName: data.display_name, avatarSkin: data.avatar_skin, avatarUrl: safeAvatarUrl(data.avatar_url), avatarSource: data.avatar_source || "builtin" };
}

export async function activeAccountSession(supabase: SupabaseClient, user: User | null) {
  if (!user) return false;
  const { data, error } = await supabase.from("focus_sessions").select("started_at,planned_seconds").eq("user_id", user.id).in("status", ["running", "paused"]).limit(1);
  // A failed guard must not switch an identity underneath a running session.
  if (error) throw new Error("focus_service_unavailable");
  return Boolean(data?.some(session => Date.parse(session.started_at) + (session.planned_seconds > 0 ? session.planned_seconds + 600 : 21600) * 1000 > Date.now()));
}
