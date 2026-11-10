import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
const ast = ts.createSourceFile("app.js", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
function context(names, overrides = {}) {
  const ctx = vm.createContext({
    state: { isDeveloper: true, personalCenter: { open: true }, developerDiagnostics: null },
    window: { FocusI18n: { getLanguage: () => "en" } }, preferences: { language: "en" },
    PUBLIC_CONFIG: { appVersion: "1.1.2", release: { developerToolsVersion: "2.0", environment: "preview", commit: "abc1234" } },
    sharedFocusScene:()=>false, escapeHtml: (s) => String(s).replaceAll("<", "&lt;"), renderPersonalCenter() {}, showToast() {},
    ...overrides,
  });
  vm.runInContext(names.map((name) => {
    const fn = ast.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === name);
    assert.ok(fn, name);
    return fn.getText(ast);
  }).join("\n"), ctx);
  return ctx;
}
const renderFunctions = ["developerToolsCopy", "developerDate", "renderDeveloperTools"];
const session = { client_session_id: "test-session-original", status: "running", timer_mode: 25, actual_seconds: 90 };

test("developer console renders actual snapshots, unknown rooms and both locales without a legacy editor", () => {
  const ctx = context(renderFunctions);
  ctx.state.developerDiagnostics = { version: "1.1.2", activeSessions: [], rooms: [
    { roomId: "cafe-01", capacity: 6, occupied: 1, available: true, seats: [{ seatId: 2, state: "occupied", mine: true }] },
    { roomId: "cafe-02", capacity: 6, occupied: null, available: false, seats: null },
  ] };
  const en = ctx.renderDeveloperTools();
  assert.match(en, /data-developer-tools-version="2.0"/);
  assert.match(en, /data-no-auto-i18n/);
  assert.match(en, /1 \/ 6/);
  assert.match(en, /Seat 2: My seat/);
  assert.match(en, /cafe-02<\/strong><span>Unknown/);
  assert.doesNotMatch(en, /[\u4e00-\u9fff]|toggle-cafe-debug-mode|toggle-library-debug-mode/);
  ctx.window.FocusI18n.getLanguage = () => "zh-CN";
  assert.match(ctx.renderDeveloperTools(), /静态 MVP 开发者控制台/);
});

test("ending a test session confirms an immutable target and never creates a new session", async () => {
  const requests = [];
  const ctx = context(["confirmDeveloperSessionEnd", "executeProfileDataAction"], {
    api: async (path, options) => { requests.push({ path, body: JSON.parse(options.body) }); },
    isActiveFocusSession: () => false, refreshDeveloperDiagnostics: async () => {}, developerToolsCopy: () => ({ ended: "Ended" }),
  });
  ctx.state.developerDiagnostics = { version: "1.1.2", activeSessions: [session] };
  ctx.confirmDeveloperSessionEnd();
  assert.equal(requests.length, 0);
  assert.equal(ctx.state.personalCenter.confirmAction, "developer-end-focus");
  ctx.state.developerDiagnostics.activeSessions = [{ ...session, client_session_id: "newer-session" }];
  await ctx.executeProfileDataAction();
  assert.deepEqual(requests, [{ path: "/api/focus/sessions/test-session-original", body: { status: "interrupted", actualSeconds: 90, pausedSeconds: 0 } }]);
});

test("ordinary accounts and stale page versions cannot open session mutation confirmation", () => {
  const ctx = context(["confirmDeveloperSessionEnd"]);
  ctx.state.developerDiagnostics = { version: "1.1.1", activeSessions: [session] };
  ctx.confirmDeveloperSessionEnd();
  assert.equal(ctx.state.personalCenter.confirmAction, undefined);
  ctx.state.developerDiagnostics.version = "1.1.2";
  ctx.state.isDeveloper = false;
  ctx.confirmDeveloperSessionEnd();
  assert.equal(ctx.state.personalCenter.confirmAction, undefined);
});

test("a diagnostics failure retains the last snapshot and role revocation removes developer access", async () => {
  const ctx = context(["refreshDeveloperDiagnostics"], { api: async () => { throw Object.assign(new Error("denied"), { status: 403 }); } });
  const snapshot = { version: "1.1.2" };
  ctx.state.developerDiagnostics = snapshot;
  await ctx.refreshDeveloperDiagnostics();
  assert.equal(ctx.state.developerDiagnostics, snapshot);
  assert.equal(ctx.state.isDeveloper, false);
  assert.equal(ctx.state.personalCenter.tab, "overview");
  assert.equal(ctx.state.developerDiagnosticsPending, false);
});

test("production room selection ignores historical renderer preferences even for developers", () => {
  const ctx = context(["roomViewForScene"], { resolveCafeRoomRenderer: () => "godot3d" });
  ctx.state.sceneId = "cafe";
  assert.equal(ctx.roomViewForScene(), "room");
});

test("authorized diagnostics strips other users' identities and preserves partial failures", async () => {
  const route = await readFile(new URL("../app/api/developer/diagnostics/route.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(route.replace(/^import .*;$/gm, "").replaceAll("export ", ""), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  const query = { select() { return this; }, eq(key, value) { assert.equal(key, "user_id"); assert.equal(value, "me"); return this; }, in: async () => ({ data: [session] }) };
  const ctx = vm.createContext({
    authenticatedSupabase: async () => ({ user: { id: "me" }, supabase: { from: () => query,
      rpc: async (_, { p_room_id }) => p_room_id === "cafe-02" ? { error: { message: "unavailable" } } : { data: { leases: [
        { seat_id: 1, state: "occupied", user_id: "other-private-user", display_name: "Private name" },
        { seat_id: 3, state: "reserved", user_id: "me" },
      ] } },
    } }),
    isDeveloper: () => true, FOCUS_ROOM_IDS: ["cafe-01", "cafe-02", "cafe-03","library-01","library-02","library-03"], roomSceneId:id=>id.split("-")[0],
    RELEASE_INFO: { version: "1.1.2" }, json: (body, init) => ({ body, init }),
  });
  vm.runInContext(compiled, ctx);
  const { body, init } = await ctx.GET();
  assert.equal(body.rooms[0].seats[2].mine, true);
  assert.equal(body.rooms[0].seats[0].state, "occupied");
  assert.equal(body.rooms[1].occupied, null);
  assert.equal(body.rooms[1].seats, null);
  assert.equal(init.headers["Cache-Control"], "no-store");
  assert.doesNotMatch(JSON.stringify(body), /other-private-user|Private name/);
});
