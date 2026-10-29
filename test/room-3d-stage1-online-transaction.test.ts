import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appSource = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
const heartbeatSource = await readFile(new URL("../app/api/sessions/[sessionId]/heartbeat/route.ts", import.meta.url), "utf8");
const migrationSource = await readFile(new URL("../supabase/migrations/20261027000100_initial_presence.sql", import.meta.url), "utf8");

test("Stage 1 reserves before movement and occupies only after contact", () => {
  const handlerIndex = appSource.indexOf("async function handleRoom3DTransaction");
  const reserveIndex = appSource.indexOf("/reserve`", handlerIndex);
  const grantIndex = appSource.indexOf('"seat_reservation_granted"', reserveIndex);
  const contactIndex = appSource.indexOf('message.event_type === "seat_contact_completed"', grantIndex);
  const occupyIndex = appSource.indexOf("/occupy`", contactIndex);
  assert.ok(reserveIndex > 0 && grantIndex > reserveIndex);
  assert.ok(contactIndex > grantIndex && occupyIndex > contactIndex);
});

test("Stage 1 starts focus heartbeat only after the three-second request", () => {
  const requestIndex = appSource.indexOf('message.event_type === "focus_autostart_requested"');
  const focusingIndex = appSource.indexOf('focusing: true', requestIndex);
  const confirmIndex = appSource.indexOf('"focus_autostart_confirmed"', requestIndex);
  assert.ok(requestIndex > 0 && focusingIndex > requestIndex && confirmIndex > focusingIndex);
});

test("Stage 1 releases failed or explicitly vacated leases", () => {
  assert.match(appSource, /await releaseRoom3DLease\(\);[\s\S]*deliverRoom3DResponse\(failed\)/);
  assert.match(appSource, /\["seat_sequence_failed", "seat_release_requested"\][\s\S]*releaseRoom3DLease/);
});

test("reserved and occupied sessions retain different lease TTLs", () => {
  assert.match(heartbeatSource, /rpc\("heartbeat_session"/);
  assert.match(migrationSource, /state='reserved' then interval '15 seconds' else interval '45 seconds'/);
  assert.match(migrationSource, /update public\.seat_leases set heartbeat_at=now\(\),expires_at=v_expires/);
});
