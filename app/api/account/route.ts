import { authenticatedSupabase, json } from "@/lib/presence";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { rateLimited } from "@/lib/security";

export async function DELETE(request: Request) {
  if (rateLimited(request, "delete-account", 3, 60 * 60_000)) return json({ error: "rate_limited" }, { status: 429 });
  const auth = await authenticatedSupabase();
  if (!auth) return json({ error: "authentication_required" }, { status: 401 });
  const admin = createAdminSupabaseClient();
  const { error } = await admin.auth.admin.deleteUser(auth.user.id);
  if (error) return json({ error: "account_delete_failed" }, { status: 503 });
  return json({ ok: true });
}
