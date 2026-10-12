import { cleanupExpired, db, json, SEAT_COUNT, validRoom } from "@/lib/presence";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await context.params;
  if (!validRoom(roomId)) return json({ error: "room_not_found" }, { status: 404 });
  const database = db();
  const now = Date.now();
  await cleanupExpired(database, now);
  const result = await database.prepare(`SELECT room_id, seat_id, session_id, guest_id, display_name,
    avatar_skin, state, activity, transition_started_at, focus_started_at, heartbeat_at, expires_at, from_seat_id
    FROM seat_leases WHERE room_id = ? AND expires_at > ? ORDER BY seat_id`).bind(roomId, now).all();
  const leases = (result.results || []).map((row) => ({
    roomId: row.room_id,
    seatId: row.seat_id,
    sessionId: row.session_id,
    guestId: row.guest_id,
    displayName: row.display_name,
    avatarSkin: row.avatar_skin,
    state: row.state,
    activity: row.activity,
    transitionStartedAt: row.transition_started_at,
    focusStartedAt: row.focus_started_at,
    heartbeatAt: row.heartbeat_at,
    expiresAt: row.expires_at,
    fromSeatId: row.from_seat_id,
  }));
  return json({ roomId, seatCount: SEAT_COUNT, serverNow: now, leases }, {
    headers: { "Cache-Control": "no-store" },
  });
}
