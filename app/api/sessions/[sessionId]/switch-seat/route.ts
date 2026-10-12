import { cleanupExpired, db, json, parseIdentity, RESERVED_TTL_MS, validRoom, validSeat } from "@/lib/presence";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const identity = parseIdentity(body);
  const roomId = String(body?.roomId || "");
  const newSeatId = Number(body?.newSeatId);
  const fromSeatId = Number(body?.fromSeatId);
  if (!identity || !validRoom(roomId) || !validSeat(newSeatId) || !validSeat(fromSeatId) || newSeatId === fromSeatId) {
    return json({ error: "invalid_switch" }, { status: 400 });
  }
  const database = db();
  const now = Date.now();
  const expiresAt = now + RESERVED_TTL_MS;
  await cleanupExpired(database, now);
  const oldLease = await database.prepare("SELECT focus_started_at FROM seat_leases WHERE room_id=? AND seat_id=? AND session_id=?")
    .bind(roomId, fromSeatId, sessionId).first<{ focus_started_at: number | null }>();
  if (!oldLease) return json({ error: "session_expired" }, { status: 409 });
  const target = await database.prepare("SELECT session_id FROM seat_leases WHERE room_id=? AND seat_id=?")
    .bind(roomId, newSeatId).first<{ session_id: string }>();
  if (target && target.session_id !== sessionId) return json({ error: "seat_taken" }, { status: 409 });

  await database.prepare(`INSERT INTO seat_leases
      (room_id, seat_id, session_id, guest_id, display_name, avatar_skin, state, activity, transition_started_at, focus_started_at, heartbeat_at, expires_at, from_seat_id)
      VALUES (?, ?, ?, ?, ?, ?, 'moving', ?, ?, ?, ?, ?, ?)
      ON CONFLICT(room_id, seat_id) DO UPDATE SET session_id=excluded.session_id, guest_id=excluded.guest_id,
      display_name=excluded.display_name, avatar_skin=excluded.avatar_skin, state='moving', activity=excluded.activity,
      transition_started_at=excluded.transition_started_at, focus_started_at=excluded.focus_started_at,
      heartbeat_at=excluded.heartbeat_at, expires_at=excluded.expires_at, from_seat_id=excluded.from_seat_id
      WHERE seat_leases.session_id=excluded.session_id`)
      .bind(roomId, newSeatId, sessionId, identity.guestId, identity.displayName, identity.avatarSkin, identity.activity, now, oldLease.focus_started_at, now, expiresAt, fromSeatId).run();
  const owner = await database.prepare("SELECT session_id FROM seat_leases WHERE room_id=? AND seat_id=?").bind(roomId, newSeatId).first<{ session_id: string }>();
  if (!owner || owner.session_id !== sessionId) return json({ error: "seat_taken" }, { status: 409 });
  await database.prepare("UPDATE room_sessions SET current_seat_id=?, state='moving', heartbeat_at=?, lease_expires_at=? WHERE id=?")
    .bind(newSeatId, now, expiresAt, sessionId).run();
  return json({ ok: true, state: "moving", roomId, fromSeatId, seatId: newSeatId, expiresAt });
}
