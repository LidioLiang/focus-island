import { z } from "zod";
import { authenticatedSupabase, json } from "@/lib/presence";

const importSchema = z.object({ sessions: z.array(z.record(z.string(), z.unknown())).max(100) });

export async function GET(request: Request) {
  const auth = await authenticatedSupabase();
  if (!auth) return json({ error: "authentication_required" }, { status: 401 });
  if (request.headers.get("X-Focus-User") !== auth.user.id) return json({ error: "identity_changed" }, { status: 409, headers: { "Cache-Control": "no-store" } });
  const url = new URL(request.url);
  const limit = Math.min(100, Math.max(1, Math.floor(Number(url.searchParams.get("limit")) || 50)));
  const offset = Math.min(100000, Math.max(0, Math.floor(Number(url.searchParams.get("offset")) || 0)));
  const active = url.searchParams.get("active") === "1";
  let query = auth.supabase.from("focus_sessions").select("*").eq("user_id", auth.user.id);
  query = query.in("status", active ? ["running", "paused"] : ["completed", "ended_early", "interrupted"]);
  const { data, error } = await query.order("started_at", { ascending: false }).order("id", { ascending: false }).range(active ? 0 : offset, active ? 0 : offset + limit);
  if (error) return json({ error: "focus_history_failed" }, { status: 503 });
  return json({ userId: auth.user.id, sessions: active ? data : data?.slice(0, limit), hasMore: !active && (data?.length || 0) > limit, nextOffset: offset + limit }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const parsed = importSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_import" }, { status: 400 });
  const auth = await authenticatedSupabase();
  if (!auth || auth.user.is_anonymous) return json({ error: "registration_required" }, { status: 401 });
  if (request.headers.get("X-Focus-User") !== auth.user.id) return json({ error: "identity_changed" }, { status: 409, headers: { "Cache-Control": "no-store" } });
  const { data, error } = await auth.supabase.rpc("import_my_focus_sessions", { p_sessions: parsed.data.sessions });
  if (error) return json({ error: "focus_import_failed" }, { status: 400 });
  return json({ ok: true, imported: data });
}

export async function DELETE(request: Request) {
  const auth = await authenticatedSupabase();
  if (!auth || auth.user.is_anonymous) return json({ error: "registration_required" }, { status: 401 });
  if (request.headers.get("X-Focus-User") !== auth.user.id) return json({ error: "identity_changed" }, { status: 409, headers: { "Cache-Control": "no-store" } });
  const { error } = await auth.supabase.rpc("clear_my_focus_sessions");
  if (error) return json({ error: "focus_clear_failed" }, { status: 400 });
  return json({ ok: true });
}
