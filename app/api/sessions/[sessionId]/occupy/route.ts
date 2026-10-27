import { z } from "zod";
import { authenticatedSupabase, json, rpcError, validRoom, validSeat } from "@/lib/presence";

const schema = z.object({ roomId: z.string(), seatId: z.number().int() });

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  if (!z.string().uuid().safeParse(sessionId).success) return json({ error: "invalid_session" }, { status: 400 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !validRoom(parsed.data.roomId) || !validSeat(parsed.data.seatId)) return json({ error: "invalid_room_or_seat" }, { status: 400 });
  const auth = await authenticatedSupabase();
  if (!auth) return json({ error: "authentication_required" }, { status: 401 });
  const { data, error } = await auth.supabase.rpc("occupy_seat", { p_session_id: sessionId, p_room_id: parsed.data.roomId, p_seat_id: parsed.data.seatId });
  if (error) return rpcError(error);
  return json(data);
}
