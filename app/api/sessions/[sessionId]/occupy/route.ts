import { db, json, OCCUPIED_TTL_MS } from "@/lib/presence";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const roomId = String(body?.roomId || "");
  const seatId = Number(body?.seatId);
  const now = Date.now();
  const expiresAt = now + OCCUPIED_TTL_MS;
  const database = db();
  const lease = await database.prepare("SELECT focus_started_at FROM seat_leases WHERE room_id = ? AND seat_id = ? AND session_id = ? AND expires_at > ?")
    .bind(roomId, seatId, sessionId, now).first<{ focus_started_at: number | null }>();
  if (!lease) return json({ error: "reservation_expired" }, { status: 409 });
  const focusStartedAt = lease.focus_started_at || now;
  await database.batch([
    database.prepare("DELETE FROM seat_leases WHERE session_id = ? AND NOT (room_id = ? AND seat_id = ?)").bind(sessionId, roomId, seatId),
    database.prepare("UPDATE seat_leases SET state='occupied', focus_started_at=?, heartbeat_at=?, expires_at=?, from_seat_id=NULL WHERE room_id=? AND seat_id=? AND session_id=?")
      .bind(focusStartedAt, now, expiresAt, roomId, seatId, sessionId),
    database.prepare("UPDATE room_sessions SET current_seat_id=?, state='occupied', focus_started_at=COALESCE(focus_started_at, ?), heartbeat_at=?, lease_expires_at=? WHERE id=?")
      .bind(seatId, focusStartedAt, now, expiresAt, sessionId),
  ]);
  return json({ ok: true, state: "occupied", roomId, seatId, focusStartedAt, expiresAt });
}
