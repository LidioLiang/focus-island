import { integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const roomSessions = sqliteTable("room_sessions", {
  id: text("id").primaryKey(),
  guestId: text("guest_id").notNull(),
  displayName: text("display_name").notNull(),
  avatarSkin: integer("avatar_skin").notNull().default(0),
  roomId: text("room_id").notNull(),
  currentSeatId: integer("current_seat_id"),
  state: text("state").notNull().default("present"),
  activity: text("activity").notNull().default("专注中"),
  enteredAt: integer("entered_at").notNull(),
  focusStartedAt: integer("focus_started_at"),
  heartbeatAt: integer("heartbeat_at").notNull(),
  leaseExpiresAt: integer("lease_expires_at").notNull(),
});

export const seatLeases = sqliteTable(
  "seat_leases",
  {
    roomId: text("room_id").notNull(),
    seatId: integer("seat_id").notNull(),
    sessionId: text("session_id").notNull(),
    guestId: text("guest_id").notNull(),
    displayName: text("display_name").notNull(),
    avatarSkin: integer("avatar_skin").notNull().default(0),
    state: text("state").notNull(),
    activity: text("activity").notNull().default("专注中"),
    transitionStartedAt: integer("transition_started_at").notNull(),
    focusStartedAt: integer("focus_started_at"),
    heartbeatAt: integer("heartbeat_at").notNull(),
    expiresAt: integer("expires_at").notNull(),
    fromSeatId: integer("from_seat_id"),
  },
  (table) => [
    primaryKey({ columns: [table.roomId, table.seatId] }),
    uniqueIndex("seat_leases_session_seat_unique").on(table.sessionId, table.seatId),
  ],
);
