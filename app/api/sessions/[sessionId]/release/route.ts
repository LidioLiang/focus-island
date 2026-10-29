import { z } from "zod";
import { authenticatedSupabase, json, rpcError } from "@/lib/presence";

export async function POST(_request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  if (!z.string().uuid().safeParse(sessionId).success) return json({ error: "invalid_session" }, { status: 400 });
  const auth = await authenticatedSupabase();
  if (!auth) return json({ error: "authentication_required" }, { status: 401 });
  const { data, error } = await auth.supabase.rpc("release_session", { p_session_id: sessionId });
  if (error) return rpcError(error);
  return json(data);
}
