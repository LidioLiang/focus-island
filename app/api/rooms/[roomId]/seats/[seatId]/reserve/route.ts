import { cleanupExpired, db, json, parseIdentity, RESERVED_TTL_MS, upsertSession, validRoom, validSeat } from "@/lib/presence";

export async function POST(request: Request, context: { params: Promise<{ roomId: string; seatId: string }> }) {
  const { roomId, seatId: rawSeatId } = await context.params;
  const seatId = Number(rawSeatId);
  if (!validRoom(roomId) || !validSeat(seatId)) return json({ error: "invalid_room_or_seat" }, { status: 404 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const identity = parseIdentity(body);
  const sessionId = String(body?.sessionId || "").slice(0, 100);
  if (!identity || !sessionId) return json({ error: "invalid_identity" }, { status: 400 });

  const database = db();
  const now = Date.now();
  const expiresAt = now + RESERVED_TTL_MS;
  await cleanupExpired(database, now);
  const existing = await database.prepare("SELECT session_id FROM seat_leases WHERE room_id = ? AND seat_id = ?").bind(roomId, seatId).first<{ session_id: string }>();
  if (existing && existing.session_id !== sessionId) return json({ error: "seat_taken" }, { status: 409 });

  await database.batch([
    database.prepare(`INSERT INTO seat_leases
      (room_id, seat_id, session_id, guest_id, display_name, avatar_skin, state, activity, transition_started_at, focus_started_at, heartbeat_at, expires_at, from_seat_id)
      VALUES (?, ?, ?, ?, ?, ?, 'reserved', ?, ?, NULL, ?, ?, NULL)
      ON CONFLICT(room_id, seat_id) DO UPDATE SET
        session_id=excluded.session_id, guest_id=excluded.guest_id, display_name=excluded.display_name,
        avatar_skin=excluded.avatar_skin, state='reserved', activity=excluded.activity,
        transition_started_at=excluded.transition_started_at, heartbeat_at=excluded.heartbeat_at,
        expires_at=excluded.expires_at, from_seat_id=NULL
      WHERE seat_leases.session_id=excluded.session_id`)
      .bind(roomId, seatId, sessionId, identity.guestId, identity.displayName, identity.avatarSkin, identity.activity, now, now, expiresAt),
  ]);
  const owner = await database.prepare("SELECT session_id FROM seat_leases WHERE room_id=? AND seat_id=?").bind(roomId, seatId).first<{ session_id: string }>();
  if (!owner || owner.session_id !== sessionId) return json({ error: "seat_taken" }, { status: 409 });
  await upsertSession(database, sessionId, roomId, identity, seatId, "reserved", expiresAt);
  return json({ ok: true, roomId, seatId, sessionId, state: "reserved", expiresAt });
}
