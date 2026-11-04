import { z } from "zod";
import { authenticatedSupabase, json, rpcError } from "@/lib/presence";
import { rateLimited } from "@/lib/security";

const schema = z.object({
  preferredRoomId: z.enum(["cafe-01", "cafe-02", "cafe-03"]),
  preferredSeatId: z.number().int().min(1).max(6),
  displayName: z.string().trim().min(1).max(24),
  avatarSkin: z.number().int().min(0).max(3),
  activity: z.string().trim().min(1).max(40),
  focusing: z.boolean().default(false),
  focusStartedAt: z.number().int().nonnegative().nullable().optional(),
});

type ResumeResult = {
  ok: boolean;
  error?: string;
  roomId?: string;
  seatId?: number;
  moved?: boolean;
  recovered?: boolean;
  expiresAt?: number;
};

export async function POST(request: Request, context: { params: Promise<{ sessionId: string }> }) {
  if (rateLimited(request, "resume-seat", 30)) return json({ error: "rate_limited" }, { status: 429 });
  const { sessionId } = await context.params;
  if (!z.string().uuid().safeParse(sessionId).success) return json({ error: "invalid_session" }, { status: 400 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "invalid_request" }, { status: 400 });
  const auth = await authenticatedSupabase();
  if (!auth) return json({ error: "authentication_required" }, { status: 401 });
  const { data, error } = await auth.supabase.rpc("resume_seat_session", {
    p_session_id: sessionId,
    p_preferred_room_id: parsed.data.preferredRoomId,
    p_preferred_seat_id: parsed.data.preferredSeatId,
    p_display_name: parsed.data.displayName,
    p_avatar_skin: parsed.data.avatarSkin,
    p_activity: parsed.data.activity,
    p_focusing: parsed.data.focusing,
    p_focus_started_at: parsed.data.focusStartedAt ? new Date(parsed.data.focusStartedAt).toISOString() : null,
  });
  if (error) return rpcError(error);
  const result = data as ResumeResult;
  if (!result.ok) return json({ error: result.error || "seat_recovery_failed" }, { status: 409 });
  return json(result);
}
