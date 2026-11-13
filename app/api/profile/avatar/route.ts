import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { authenticatedSupabase, json } from "@/lib/presence";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { readProfile } from "@/lib/profile";
import { rateLimited } from "@/lib/security";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (rateLimited(request, "avatar-upload", 8, 10 * 60_000)) return json({ error: "rate_limited" }, { status: 429 });
  const auth = await authenticatedSupabase();
  if (!auth) return json({ error: "authentication_required" }, { status: 401 });
  if (request.headers.get("X-Focus-User") !== auth.user.id) return json({ error: "identity_changed" }, { status: 409 });
  if (Number(request.headers.get("content-length")) > 4_300_000) return json({ error: "image_too_large" }, { status: 413 });
  const file = (await request.formData().catch(() => null))?.get("avatar");
  if (!(file instanceof File) || file.size > 4 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) return json({ error: "invalid_image" }, { status: 400 });
  let image: Buffer;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const metadata = await sharp(input, { limitInputPixels: 16_000_000, animated: false }).metadata();
    if (!["jpeg", "png", "webp"].includes(metadata.format || "") || (metadata.pages || 1) > 1) throw new Error("invalid_image");
    image = await sharp(input, { limitInputPixels: 16_000_000 }).rotate().resize(256, 256, { fit: "cover" }).webp({ quality: 84 }).toBuffer();
  } catch { return json({ error: "invalid_image" }, { status: 400 }); }
  const admin = createAdminSupabaseClient();
  const path = `${auth.user.id}/${randomUUID()}.webp`;
  const { error: uploadError } = await admin.storage.from("profile-avatars").upload(path, image, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
  if (uploadError) return json({ error: "avatar_upload_failed" }, { status: 503 });
  const avatarUrl = admin.storage.from("profile-avatars").getPublicUrl(path).data.publicUrl;
  try {
    const current = await readProfile(auth.supabase, auth.user);
    const { error } = await auth.supabase.rpc("set_my_profile", { p_display_name: current.displayName, p_avatar_skin: current.avatarSkin, p_avatar_url: avatarUrl, p_avatar_source: "upload" });
    if (error) throw error;
    // Keep previous immutable images: another tab may still be displaying one.
    return json({ profile: await readProfile(auth.supabase, auth.user) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    await admin.storage.from("profile-avatars").remove([path]);
    return json({ error: "profile_save_failed" }, { status: 503 });
  }
}
