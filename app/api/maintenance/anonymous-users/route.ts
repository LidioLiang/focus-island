import { json } from "@/lib/presence";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return json({ error: "maintenance_not_configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return json({ error: "unauthorized" }, { status: 401 });
  }

  const before = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.rpc("cleanup_stale_anonymous_users", { p_before: before });
  if (error) return json({ error: "anonymous_cleanup_failed" }, { status: 503 });
  return json({ ok: true, deleted: Number(data || 0), before });
}
