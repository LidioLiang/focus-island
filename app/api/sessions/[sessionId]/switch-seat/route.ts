import { z } from "zod";
import { authenticatedSupabase, json, parseIdentity, rpcError, validRoom, validSeat } from "@/lib/presence";

const schema = z.object({ roomId: z.string(), fromSeatId: z.number().int(), newSeatId: z.number().int() });

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  const body = await request.json().catch(() => null);
  const identity = parseIdentity(body);
  const movement = schema.safeParse(body);
  if (!identity || identity.sessionId !== sessionId || !movement.success || !validRoom(movement.data.roomId) || !validSeat(movement.data.fromSeatId) || !validSeat(movement.data.newSeatId) || movement.data.fromSeatId === movement.data.newSeatId) {
    return json({ error: "invalid_switch" }, { status: 400 });
  }
  const auth = await authenticatedSupabase();
  if (!auth) return json({ error: "authentication_required" }, { status: 401 });
  const { data, error } = await auth.supabase.rpc("switch_seat", {
    p_session_id: sessionId, p_room_id: movement.data.roomId, p_from_seat_id: movement.data.fromSeatId,
    p_new_seat_id: movement.data.newSeatId, p_display_name: identity.displayName,
    p_avatar_skin: identity.avatarSkin, p_activity: identity.activity,
  });
  if (error) return rpcError(error);
  return json(data);
}
