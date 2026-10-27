import { authenticatedSupabase, json, legacyLease, rpcError, SEAT_COUNT, validRoom } from "@/lib/presence";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await context.params;
  if (!validRoom(roomId)) return json({ error: "room_not_found" }, { status: 404 });
  const auth = await authenticatedSupabase();
  if (!auth) return json({ error: "authentication_required" }, { status: 401 });
  const { data, error } = await auth.supabase.rpc("get_room_state", { p_room_id: roomId });
  if (error) return rpcError(error);
  const payload = (data || {}) as { leases?: Record<string, unknown>[]; server_now?: string };
  return json({
    roomId,
    seatCount: SEAT_COUNT,
    serverNow: payload.server_now ? Date.parse(payload.server_now) : Date.now(),
    leases: (payload.leases || []).map(legacyLease),
  }, { headers: { "Cache-Control": "no-store" } });
}
