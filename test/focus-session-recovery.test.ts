import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../supabase/migrations/20261104073347_recover_stale_focus_sessions.sql", import.meta.url), "utf8");
const app = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
const route = await readFile(new URL("../app/api/focus/sessions/start/route.ts", import.meta.url), "utf8");

test("stale timed and free-focus sessions are interrupted before a new session starts", () => {
  assert.match(migration, /session\.planned_seconds > 0 then session\.planned_seconds \+ 600/);
  assert.match(migration, /else 21600/);
  assert.match(migration, /set status = 'interrupted'/);
  assert.match(migration, /trial_status = 'consumed'/);
  assert.match(migration, /create or replace function public\.start_my_focus_session/);
  assert.match(migration, /if exists\(select 1 from public\.focus_sessions[\s\S]*raise exception 'active_session_exists'/);
  assert.match(migration, /revoke all on function public\.start_my_focus_session[\s\S]*from public, anon/);
  assert.match(migration, /grant execute on function public\.start_my_focus_session[\s\S]*to authenticated/);
});

test("fresh concurrent sessions stay protected and surface a useful client message", () => {
  assert.match(route, /active_session_exists[\s\S]*return 409/);
  assert.match(app, /error\.status === 409 && error\.message === "active_session_exists"/);
  assert.match(app, /await openFocusRecovery\(\)/);
});

test("the next focus cycle waits for cloud authorization before starting locally", () => {
  const nextFocus = app.slice(app.indexOf("async function startNextFocusSession"), app.indexOf("function notifyFocusComplete"));
  const authorizationIndex = nextFocus.indexOf("await authorizeFocusStart()");
  const startIndex = nextFocus.indexOf("state.sessionStartedAt = Date.now()");
  assert.ok(authorizationIndex >= 0);
  assert.ok(startIndex > authorizationIndex);
  assert.match(nextFocus, /state\.sessionStartedAt = null/);
  assert.match(nextFocus, /state\.isRunning = false/);
  assert.match(nextFocus, /startTicker\(\)/);
});
