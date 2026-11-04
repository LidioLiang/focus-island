import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../supabase/migrations/20261103000100_resume_expired_seat_session.sql", import.meta.url), "utf8");
const route = await readFile(new URL("../app/api/sessions/[sessionId]/resume/route.ts", import.meta.url), "utf8");
const app = await readFile(new URL("../public/app.js", import.meta.url), "utf8");

test("expired cafe sessions recover through one authenticated atomic RPC", () => {
  assert.match(migration, /create or replace function public\.resume_seat_session/);
  assert.match(migration, /v_user_id uuid := auth\.uid\(\)/);
  assert.match(migration, /for v_room in[\s\S]*order by room_id[\s\S]*pg_advisory_xact_lock/);
  assert.match(migration, /p_preferred_room_id[\s\S]*p_preferred_seat_id/);
  assert.match(migration, /'error', 'system_rooms_full'/);
  assert.match(migration, /revoke all on function public\.resume_seat_session[\s\S]*from public,anon/);
  assert.match(migration, /grant execute on function public\.resume_seat_session[\s\S]*to authenticated/);
  assert.match(route, /rpc\("resume_seat_session"/);
});

test("browser resume recovers before discarding the seat and keeps the focus clock", () => {
  const heartbeat = app.slice(app.indexOf("async function sendHeartbeat"), app.indexOf("async function releaseSeat"));
  assert.match(heartbeat, /await recoverCafeSeat\("heartbeat"\)/);
  assert.doesNotMatch(heartbeat, /座位连接已过期，请重新选座/);
  assert.match(heartbeat, /state\.roomId = result\.roomId/);
  assert.match(heartbeat, /state\.currentSeatId = Number\(result\.seatId\)/);
  assert.match(heartbeat, /persistActiveSession\(true\)/);
  assert.doesNotMatch(heartbeat, /state\.sessionStartedAt = null/);
  assert.match(app, /visibilitychange[\s\S]*recoverCafeSeat\("visibility"\)/);
  assert.match(app, /addEventListener\("pageshow"[\s\S]*recoverCafeSeat\("pageshow"\)/);
  assert.match(app, /addEventListener\("online"[\s\S]*recoverCafeSeat\("online"\)/);
});
