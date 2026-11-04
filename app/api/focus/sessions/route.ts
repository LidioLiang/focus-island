import { z } from "zod";
import { authenticatedSupabase, json } from "@/lib/presence";

const importSchema = z.object({ sessions: z.array(z.record(z.string(), z.unknown())).max(100) });

export async function GET(request: Request) {
  const auth = await authenticatedSupabase();
  if (!auth || auth.user.is_anonymous) return json({ error: "registration_required" }, { status: 401 });
  const url = new URL(request.url);
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit")) || 50));
  const { data, error } = await auth.supabase.from("focus_sessions").select("*").order("started_at", { ascending: false }).limit(limit);
  if (error) return json({ error: "focus_history_failed" }, { status: 503 });
  return json({ sessions: data }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const parsed = importSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_import" }, { status: 400 });
  const auth = await authenticatedSupabase();
  if (!auth || auth.user.is_anonymous) return json({ error: "registration_required" }, { status: 401 });
  const { data, error } = await auth.supabase.rpc("import_my_focus_sessions", { p_sessions: parsed.data.sessions });
  if (error) return json({ error: "focus_import_failed" }, { status: 400 });
  return json({ ok: true, imported: data });
}

export async function DELETE() {
  const auth = await authenticatedSupabase();
  if (!auth || auth.user.is_anonymous) return json({ error: "registration_required" }, { status: 401 });
  const { error } = await auth.supabase.rpc("clear_my_focus_sessions");
  if (error) return json({ error: "focus_clear_failed" }, { status: 400 });
  return json({ ok: true });
}
