import { authenticatedSupabase, json, parseIdentity, rpcError, validRoom, validSeat } from "@/lib/presence";
import { rateLimited } from "@/lib/security";

export async function POST(request: Request, context: { params: Promise<{ roomId: string; seatId: string }> }) {
  if (rateLimited(request, "reserve", 40)) return json({ error: "rate_limited" }, { status: 429 });
  const { roomId, seatId: rawSeatId } = await context.params;
  const seatId = Number(rawSeatId);
  if (!validRoom(roomId) || !validSeat(seatId)) return json({ error: "invalid_room_or_seat" }, { status: 404 });
  const identity = parseIdentity(await request.json().catch(() => null));
  if (!identity) return json({ error: "invalid_identity" }, { status: 400 });
  const auth = await authenticatedSupabase();
  if (!auth) return json({ error: "authentication_required" }, { status: 401 });
  const { data, error } = await auth.supabase.rpc("reserve_seat", {
    p_room_id: roomId, p_seat_id: seatId, p_session_id: identity.sessionId,
    p_display_name: identity.displayName, p_avatar_skin: identity.avatarSkin, p_activity: identity.activity,
  });
  if (error) return rpcError(error);
  return json(data);
}
