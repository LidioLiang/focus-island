import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const migration = await readFile(new URL("../supabase/migrations/20261027000100_initial_presence.sql", import.meta.url), "utf8");
const appSource = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
const vercelConfig = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));

test("production scripts use native Next.js without Cloudflare runtime packages", () => {
  assert.equal(packageJson.scripts.dev, "next dev -p 5173");
  assert.equal(packageJson.scripts.build, "next build --webpack");
  for (const name of ["vinext", "vite", "wrangler", "drizzle-orm", "@cloudflare/vite-plugin"]) {
    assert.equal(packageJson.dependencies?.[name] || packageJson.devDependencies?.[name], undefined);
  }
});

test("all public presence tables enable RLS and authenticated clients use RPC", () => {
  for (const table of ["profiles", "room_instances", "room_sessions", "seat_leases"]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }
  assert.match(migration, /revoke all on public\.profiles[\s\S]*from anon, authenticated/);
});

test("seat mutations are serialized and owned by auth.uid", () => {
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /v_user_id uuid :=?\s*auth\.uid\(\)/);
  assert.match(migration, /raise exception 'seat_taken'/);
});

test("realtime replaces two-second polling but retains snapshot calibration", () => {
  assert.match(appSource, /focus-island:subscribe-room/);
  assert.match(appSource, /focus-island:room-change/);
  assert.match(appSource, /setInterval\(\(\) => syncCafeState\(\), 60000\)/);
  assert.doesNotMatch(appSource, /setInterval\(\(\) => syncCafeState\(\), 2000\)/);
});

test("heartbeat-only lease changes are excluded from realtime broadcasts", () => {
  assert.match(migration, /v_visible_changed := tg_op <> 'UPDATE'/);
  assert.doesNotMatch(migration.slice(migration.indexOf("v_visible_changed :="), migration.indexOf("if v_visible_changed")), /heartbeat_at|expires_at/);
});

test("stale anonymous accounts are cleaned by an authenticated daily maintenance job", () => {
  assert.match(migration, /cleanup_stale_anonymous_users\(p_before timestamptz\)/);
  assert.match(migration, /u\.is_anonymous is true/);
  assert.match(migration, /grant execute on function public\.cleanup_stale_anonymous_users\(timestamptz\) to service_role/);
  assert.deepEqual(vercelConfig.crons, [
    { path: "/api/maintenance/anonymous-users", schedule: "0 3 * * *" },
  ]);
});
