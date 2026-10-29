import { z } from "zod";
import { authenticatedSupabase, json, legacyLease, rpcError } from "@/lib/presence";

const schema = z.object({ activity: z.string().trim().min(1).max(40).default("安静专注"), focusing: z.boolean().default(false) });

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  if (!z.string().uuid().safeParse(sessionId).success) return json({ error: "invalid_session" }, { status: 400 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return json({ error: "invalid_request" }, { status: 400 });
  const auth = await authenticatedSupabase();
  if (!auth) return json({ error: "authentication_required" }, { status: 401 });
  const { data, error } = await auth.supabase.rpc("heartbeat_session", { p_session_id: sessionId, p_activity: parsed.data.activity, p_focusing: parsed.data.focusing });
  if (error) return rpcError(error);
  const payload = data as { lease: Record<string, unknown>; server_now: string };
  const lease = legacyLease(payload.lease);
  return json({ ok: true, lease, serverNow: Date.parse(payload.server_now), expiresAt: lease.expiresAt });
}
