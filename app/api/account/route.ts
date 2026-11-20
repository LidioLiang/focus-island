import { authenticatedSupabase, json } from "@/lib/presence";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { rateLimited } from "@/lib/security";
import { activeAccountSession } from "@/lib/profile";

export async function DELETE(request: Request) {
  if (rateLimited(request, "delete-account", 3, 60 * 60_000)) return json({ error: "rate_limited" }, { status: 429 });
  const auth = await authenticatedSupabase();
  if (!auth) return json({ error: "authentication_required" }, { status: 401 });
  if (request.headers.has("X-Focus-User") && request.headers.get("X-Focus-User") !== auth.user.id) return json({ error: "identity_changed" }, { status: 409 });
  if (await activeAccountSession(auth.supabase, auth.user)) return json({ error: "active_session_exists" }, { status: 409 });
  const admin = createAdminSupabaseClient();
  // Supabase cannot delete an Auth user who still owns Storage objects. Only remove this user's folder.
  const bucket = admin.storage.from("profile-avatars");
  for (let page = 0; page < 100; page++) {
    const { data, error: listError } = await bucket.list(auth.user.id, { limit: 100 });
    if (listError) return json({ error: "account_delete_failed" }, { status: 503 });
    if (!data?.length) break;
    if (data.some(item => !item.id || item.name.includes("/") || item.name.includes(".."))) return json({ error: "account_delete_failed" }, { status: 503 });
    const { error: removeError } = await bucket.remove(data.map(item => `${auth.user.id}/${item.name}`));
    if (removeError || page === 99) return json({ error: "account_delete_failed" }, { status: 503 });
  }
  const { error } = await admin.auth.admin.deleteUser(auth.user.id);
  if (error) return json({ error: "account_delete_failed" }, { status: 503 });
  return json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
