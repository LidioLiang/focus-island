import { authenticatedSupabase, CAFE_SYSTEM_ROOM_IDS, json } from "@/lib/presence";
import { isDeveloper } from "@/lib/authorization";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await authenticatedSupabase();
  if (!auth) return json({ error: "authentication_required" }, { status: 401 });
  if (!isDeveloper(auth.user)) return json({ error: "developer_required" }, { status: 403 });
  const [active, ...rooms] = await Promise.all([
    auth.supabase.from("focus_sessions").select("client_session_id,status,timer_mode,started_at,actual_seconds")
      .eq("user_id", auth.user.id).in("status", ["running", "paused"]),
    ...CAFE_SYSTEM_ROOM_IDS.map((roomId) => auth.supabase.rpc("get_room_state", { p_room_id: roomId })),
  ]);
  return json({
    version: "1.1.1", renderer: "static", checkedAt: new Date().toISOString(),
    activeSessions: active.error ? null : active.data,
    rooms: rooms.map((room, index) => ({
      roomId: CAFE_SYSTEM_ROOM_IDS[index], capacity: 6,
      occupied: room.error ? null : ((room.data as { leases?: unknown[] } | null)?.leases?.length || 0),
      available: !room.error,
    })),
  }, { headers: { "Cache-Control": "no-store" } });
}
