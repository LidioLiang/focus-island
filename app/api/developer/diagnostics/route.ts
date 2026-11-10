import { authenticatedSupabase, CAFE_SYSTEM_ROOM_IDS, json } from "@/lib/presence";
import { isDeveloper } from "@/lib/authorization";
import { RELEASE_INFO } from "@/lib/release";

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
    version: RELEASE_INFO.version, release: RELEASE_INFO,
    renderer: "static", checkedAt: new Date().toISOString(),
    activeSessions: active.error ? null : active.data,
    rooms: rooms.map((room, index) => {
      const leases = ((room.data as { leases?: Array<{ seat_id: number; state: string; user_id: string }> } | null)?.leases || []);
      return {
        roomId: CAFE_SYSTEM_ROOM_IDS[index], capacity: 6,
        occupied: room.error ? null : leases.length, available: !room.error,
        seats: room.error ? null : Array.from({ length: 6 }, (_, seat) => {
          const lease = leases.find((item) => Number(item.seat_id) === seat + 1);
          return { seatId: seat + 1, state: lease?.state || "available", mine: lease?.user_id === auth.user.id };
        }),
      };
    }),
  }, { headers: { "Cache-Control": "no-store" } });
}
