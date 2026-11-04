import { z } from "zod";
import { cookies } from "next/headers";
import { ACCESS_COOKIE_NAME, verifyAccessSnapshot } from "@/lib/access";
import { authenticatedSupabase, json } from "@/lib/presence";
import { rateLimited } from "@/lib/security";

const schema = z.object({
  clientSessionId: z.string().min(8).max(160),
  sceneId: z.string().min(1).max(40).default("cafe"),
  roomId: z.string().max(80).default(""),
  seatId: z.number().int().min(1).max(100).nullable().default(null),
  timerMode: z.union([z.literal(0), z.literal(25), z.literal(50)]),
});

function statusFor(message: string) {
  if (message.includes("payment_required") || message.includes("trial_requires_25")) return 402;
  if (message.includes("registration_required")) return 403;
  if (message.includes("active_session_exists")) return 409;
  return 400;
}

export async function POST(request: Request) {
  if (rateLimited(request, "focus-start", 15)) return json({ error: "rate_limited" }, { status: 429 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_focus_session" }, { status: 400 });
  const auth = await authenticatedSupabase();
  if (!auth) return json({ error: "authentication_required" }, { status: 401 });
  const { data, error } = await auth.supabase.rpc("start_my_focus_session", {
    p_client_session_id: parsed.data.clientSessionId,
    p_scene_id: parsed.data.sceneId,
    p_room_id: parsed.data.roomId,
    p_seat_id: parsed.data.seatId,
    p_timer_mode: parsed.data.timerMode,
  });
  if (error) {
    const known = ["payment_required", "trial_requires_25", "registration_required", "active_session_exists"];
    const code = known.find((item) => error.message.includes(item)) || "focus_start_failed";
    if (code === "focus_start_failed" && !auth.user.is_anonymous) {
      const cookieStore = await cookies();
      const snapshot = verifyAccessSnapshot(cookieStore.get(ACCESS_COOKIE_NAME)?.value, auth.user.id);
      if (snapshot) {
        return json({ session: {
          client_session_id: parsed.data.clientSessionId, scene_id: parsed.data.sceneId,
          room_id: parsed.data.roomId || null, seat_id: parsed.data.seatId, timer_mode: parsed.data.timerMode,
          planned_seconds: parsed.data.timerMode * 60, started_at: new Date().toISOString(),
          status: "running", is_trial: false, offline_grace: true,
        }, resumed: false, offlineGrace: true }, { headers: { "Cache-Control": "no-store", "X-Access-Source": "signed-offline-grace" } });
      }
    }
    return json({ error: code }, { status: statusFor(error.message) });
  }
  return json(data, { headers: { "Cache-Control": "no-store" } });
}
