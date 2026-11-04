import { z } from "zod";
import { authenticatedSupabase, json } from "@/lib/presence";

const schema = z.object({
  status: z.enum(["running", "paused", "completed", "ended_early", "interrupted"]),
  actualSeconds: z.number().int().min(0).max(86400),
  pausedSeconds: z.number().int().min(0).max(86400).default(0),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_focus_update" }, { status: 400 });
  const { id } = await context.params;
  if (id.length < 8 || id.length > 160) return json({ error: "invalid_focus_session" }, { status: 400 });
  const auth = await authenticatedSupabase();
  if (!auth) return json({ error: "authentication_required" }, { status: 401 });
  const { data, error } = await auth.supabase.rpc("update_my_focus_session", {
    p_client_session_id: id,
    p_status: parsed.data.status,
    p_actual_seconds: parsed.data.actualSeconds,
    p_paused_seconds: parsed.data.pausedSeconds,
  });
  if (error) return json({ error: error.message.includes("focus_session_not_found") ? "focus_session_not_found" : "focus_update_failed" }, { status: error.message.includes("not_found") ? 404 : 400 });
  return json({ session: data });
}
