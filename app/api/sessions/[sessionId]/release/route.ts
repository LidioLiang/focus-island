import { db, json } from "@/lib/presence";

export async function POST(_request: Request, context: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await context.params;
  const database = db();
  await database.batch([
    database.prepare("DELETE FROM seat_leases WHERE session_id=?").bind(sessionId),
    database.prepare("DELETE FROM room_sessions WHERE id=?").bind(sessionId),
  ]);
  return json({ ok: true });
}
