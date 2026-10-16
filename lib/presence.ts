import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";

export const ROOM_IDS = new Set(["cafe-sun", "cafe-rain", "cafe-sunset", "cafe-night"]);
export const SEAT_COUNT = 6;
export const RESERVED_TTL_MS = 15_000;
export const OCCUPIED_TTL_MS = 45_000;

export type IdentityPayload = {
  guestId: string;
  displayName: string;
  avatarSkin: number;
  activity?: string;
};

export function db(): D1Database {
  if (!env.DB) throw new Error("D1 binding DB is unavailable");
  return env.DB;
}

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
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  const guestId = String(body.guestId || "").slice(0, 80);
  const displayName = String(body.displayName || "").trim().slice(0, 24);
  const avatarSkin = Number(body.avatarSkin);
  if (!guestId || !displayName || !Number.isInteger(avatarSkin) || avatarSkin < 0 || avatarSkin > 3) return null;
  return {
    guestId,
    displayName,
    avatarSkin,
    activity: String(body.activity || "安静专注").trim().slice(0, 40) || "安静专注",
  };
}

export async function cleanupExpired(database: D1Database, now = Date.now()) {
  await database.batch([
    database.prepare("DELETE FROM seat_leases WHERE expires_at <= ?").bind(now),
    database.prepare("DELETE FROM room_sessions WHERE lease_expires_at <= ?").bind(now),
  ]);
}

export async function upsertSession(
  database: D1Database,
  sessionId: string,
  roomId: string,
  identity: IdentityPayload,
  seatId: number | null,
  sessionState: string,
  expiresAt: number,
  focusStartedAt: number | null = null,
) {
  const now = Date.now();
  await database
    .prepare(`INSERT INTO room_sessions
      (id, guest_id, display_name, avatar_skin, room_id, current_seat_id, state, activity, entered_at, focus_started_at, heartbeat_at, lease_expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        guest_id=excluded.guest_id,
        display_name=excluded.display_name,
        avatar_skin=excluded.avatar_skin,
        room_id=excluded.room_id,
        current_seat_id=excluded.current_seat_id,
        state=excluded.state,
        activity=excluded.activity,
        focus_started_at=COALESCE(room_sessions.focus_started_at, excluded.focus_started_at),
        heartbeat_at=excluded.heartbeat_at,
        lease_expires_at=excluded.lease_expires_at`)
    .bind(
      sessionId,
      identity.guestId,
      identity.displayName,
      identity.avatarSkin,
      roomId,
      seatId,
      sessionState,
      identity.activity || "安静专注",
      now,
      focusStartedAt,
      now,
      expiresAt,
    )
    .run();
}
