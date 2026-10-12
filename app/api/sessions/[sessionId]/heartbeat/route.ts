import { db, json, OCCUPIED_TTL_MS } from "@/lib/presence";

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const activity = String(body.activity || "安静专注").slice(0, 40);
  const now = Date.now();
  const expiresAt = now + OCCUPIED_TTL_MS;
  const database = db();
  await database.batch([
    database.prepare("UPDATE room_sessions SET heartbeat_at=?, lease_expires_at=?, activity=? WHERE id=?")
      .bind(now, expiresAt, activity, sessionId),
    database.prepare("UPDATE seat_leases SET heartbeat_at=?, expires_at=?, activity=? WHERE session_id=?")
      .bind(now, expiresAt, activity, sessionId),
  ]);
  const lease = await database.prepare("SELECT room_id, seat_id, state, focus_started_at FROM seat_leases WHERE session_id=? ORDER BY CASE state WHEN 'occupied' THEN 0 ELSE 1 END LIMIT 1")
    .bind(sessionId).first();
  if (!lease) return json({ error: "session_expired" }, { status: 404 });
  return json({ ok: true, lease, serverNow: now, expiresAt });
}
