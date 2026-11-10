import type { SupabaseClient, User } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { safeAvatarUrl } from "@/lib/profile";

// The one-time RPC validates the token before any privileged source-profile read.
export async function mergeGuestAccount(supabase: SupabaseClient, user: User, tokenHash: string) {
  const { data, error } = await supabase.rpc("complete_account_merge", { p_token_hash: tokenHash });
  if (error) throw new Error(error.message.includes("merge_request_invalid") ? "merge_request_invalid" : "merge_failed");
  const { data: existing, error: profileError } = await supabase.rpc("get_my_profile");
  if (profileError) return { ...data, profileTransferWarning: true };
  // A returning member keeps the profile already saved to their account.
  if (existing || !data?.anonymousUserId) return data;
  const sourceId = String(data.anonymousUserId);
  const admin = createAdminSupabaseClient();
  const { data: source } = await admin.from("profiles").select("display_name,avatar_skin,avatar_url,avatar_source").eq("user_id", sourceId).maybeSingle();
  if (!source) return data;
  let avatarUrl = safeAvatarUrl(source.avatar_url), avatarSource = source.avatar_source || "builtin";
  let warning = false;
  if (avatarSource === "upload") {
    const prefix = `/storage/v1/object/public/profile-avatars/${sourceId}/`;
    const url = avatarUrl ? new URL(avatarUrl) : null;
    if (url?.pathname.startsWith(prefix)) {
      const path = `${user.id}/${randomUUID()}.webp`;
      const oldPath = url.pathname.slice('/storage/v1/object/public/profile-avatars/'.length);
      const { error: copyError } = await admin.storage.from("profile-avatars").copy(oldPath, path);
      if (!copyError) avatarUrl = admin.storage.from("profile-avatars").getPublicUrl(path).data.publicUrl;
      else warning = true;
    } else warning = true;
    if (warning) { avatarUrl = null; avatarSource = "builtin"; }
  }
  const { error: saveError } = await supabase.rpc("set_my_profile", { p_display_name: source.display_name, p_avatar_skin: source.avatar_skin, p_avatar_url: avatarUrl, p_avatar_source: avatarSource });
  return { ...data, profileTransferWarning: warning || Boolean(saveError) };
}
