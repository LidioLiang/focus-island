import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const CAFE_SYSTEM_ROOM_IDS = ["cafe-01", "cafe-02", "cafe-03"] as const;
export const ROOM_IDS = new Set<string>([...CAFE_SYSTEM_ROOM_IDS]);
export const SEAT_COUNT = 6;
export const RESERVED_TTL_MS = 15_000;
export const OCCUPIED_TTL_MS = 45_000;

export const identitySchema = z.object({
  sessionId: z.string().uuid(),
  guestId: z.string().max(80).optional(),
  displayName: z.string().trim().min(1).max(24),
  avatarSkin: z.number().int().min(0).max(3),
  activity: z.string().trim().min(1).max(40).default("安静专注"),
});

export type IdentityPayload = z.infer<typeof identitySchema>;

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function validRoom(roomId: string) {
  return ROOM_IDS.has(roomId);
}

export function validSeat(seatId: number) {
  return Number.isInteger(seatId) && seatId >= 1 && seatId <= SEAT_COUNT;
}

export function parseIdentity(value: unknown): IdentityPayload | null {
  const parsed = identitySchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export async function authenticatedSupabase() {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { supabase, user };
}

export function rpcError(error: { message?: string; code?: string } | null) {
  const message = error?.message || "database_error";
  const known = ["seat_taken", "reservation_expired", "session_expired", "room_not_found", "system_rooms_full"];
  const code = known.find((item) => message.includes(item)) || "database_error";
  const status = code === "seat_taken" || code.includes("expired") ? 409 : code === "room_not_found" ? 404 : 500;
  return json({ error: code }, { status });
}

export function milliseconds(value: string | number | null | undefined) {
  if (value == null) return null;
  if (typeof value === "number") return value;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function legacyLease(row: Record<string, unknown>) {
  return {
    roomId: row.room_id,
    seatId: row.seat_id,
    sessionId: row.session_id,
    guestId: row.user_id,
    displayName: row.display_name,
    avatarSkin: row.avatar_skin,
    state: row.state,
    activity: row.activity,
    transitionStartedAt: milliseconds(row.transition_started_at as string | null),
    focusStartedAt: milliseconds(row.focus_started_at as string | null),
    heartbeatAt: milliseconds(row.heartbeat_at as string | null),
    expiresAt: milliseconds(row.expires_at as string | null),
    fromSeatId: row.from_seat_id,
    memberType: "human",
  };
}
