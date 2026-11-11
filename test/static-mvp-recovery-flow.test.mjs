import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
const ast = ts.createSourceFile("app.js", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
function appFunctions(names) {
  return names.map((name) => {
    const statement = ast.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === name);
    assert.ok(statement, `Missing application function ${name}`);
    return statement.getText(ast);
  }).join("\n");
}

function harness(functions, overrides = {}) {
  const storage = new Map();
  const context = vm.createContext({
    state: { sceneId: "cafe", roomId: "cafe-01", selectedSeat: 0, timerMode: 25, durationSeconds: 1500,
      remainingSeconds: 1500, elapsedSeconds: 0, cloudFocusClientId: null, isRunning: false,
      sessionStartedAt: null, authPending: false, personalCenter: {}, focusRecovery: null },
    localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    PUBLIC_CONFIG: { minimalMvp: false }, crypto: { randomUUID }, Date, encodeURIComponent,
    onlineUserId: "user-a", focusAuthorizationPromise: null, pendingFocusUpdatePromise: null,
    onlineIdentityPromise: null, accessStatusFetchedAt: 0, lastTick: null,
    seatReleaseRevision: 0, identity: { sessionId: "current-seat-session" },
    showToast() {}, clearImmersiveAutoEnter() {}, renderAccessOverlay() {}, persistActiveSession() {},
    closePersonalCenter() {}, render() {}, startTicker() {}, updateAudio() {},
    closeAccessOverlay() { context.state.accessOverlay = null; context.state.focusRecovery = null; },
    openPaywall(reason) { context.state.accessOverlay = "paywall"; context.state.paywallReason = reason; },
    openAuthGate() { context.state.accessOverlay = "auth"; },
    ...overrides,
  });
  vm.runInContext(appFunctions(functions), context);
  return context;
}

const startFunctions = ["authorizeFocusStart", "requestFocusAuthorization"];

test("double clicking start issues one authorization and one client session ID", async () => {
  let calls = 0;
  let release;
  const waiting = new Promise((resolve) => { release = resolve; });
  const context = harness(startFunctions, {
    flushPendingFocusUpdates: async () => {},
    api: async () => { calls++; await waiting; return {}; },
  });
  const first = context.authorizeFocusStart();
  const second = context.authorizeFocusStart();
  release();
  assert.deepEqual(await Promise.all([first, second]), [true, true]);
  assert.equal(calls, 1);
  assert.ok(context.state.cloudFocusClientId);
});

test("an active-session conflict opens recovery instead of trapping the user", async () => {
  const previous = { client_session_id: "previous-session", status: "running", timer_mode: 25 };
  const context = harness([...startFunctions, "openFocusRecovery"], {
    flushPendingFocusUpdates: async () => {},
    api: async (path) => {
      if (path.endsWith("/start")) throw Object.assign(new Error("active_session_exists"), { status: 409 });
      assert.equal(path, "/api/focus/sessions?active=1");
      return { sessions: [previous] };
    },
  });
  assert.equal(await context.authorizeFocusStart(), false);
  assert.equal(context.state.accessOverlay, "focus-recovery");
  assert.equal(context.state.focusRecovery.client_session_id, "previous-session");
  assert.equal(context.state.cloudFocusClientId, null);
});

test("resume reuses the exact prior ID and does not create or end a second session", async () => {
  const session = { client_session_id: "previous-session", status: "running", timer_mode: 25,
    planned_seconds: 1500, started_at: new Date(Date.now() - 120_000).toISOString(),
    actual_seconds: 90, paused_seconds: 0, scene_id: "cafe", room_id: "cafe-01", seat_id: 1 };
  const requests = [];
  const context = harness(["resolvePreviousFocus"], {
    api: async (path, options) => { requests.push({ path, body: JSON.parse(options.body) }); return { session }; },
  });
  context.state.focusRecovery = session;
  await context.resolvePreviousFocus(false);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].body.clientSessionId, "previous-session");
  assert.equal(context.state.cloudFocusClientId, "previous-session");
  assert.equal(context.state.elapsedSeconds, 120);
  assert.equal(context.state.view, "focus");
  assert.equal(context.state.isRunning, true);
});

test("ending an old trial cannot bypass the new-session paywall", async () => {
  const requests = [];
  const context = harness(["resolvePreviousFocus", "startFocusFromSeat", ...startFunctions], {
    flushPendingFocusUpdates: async () => {},
    api: async (path, options) => {
      requests.push({ path, method: options.method });
      if (options.method === "PATCH") return {};
      throw Object.assign(new Error("payment_required"), { status: 402 });
    },
  });
  context.state.focusRecovery = { client_session_id: "old-trial", actual_seconds: 100 };
  await context.resolvePreviousFocus(true);
  assert.deepEqual(requests.map((item) => item.method), ["PATCH", "POST"]);
  assert.equal(requests[0].path, "/api/focus/sessions/old-trial");
  assert.equal(context.state.isRunning, false);
  assert.equal(context.state.cloudFocusClientId, null);
  assert.equal(context.state.accessOverlay, "paywall");
});

test("a failed completion remains queued until a later successful retry", async () => {
  let fail = true;
  const context = harness(["queueFocusUpdate", "flushPendingFocusUpdates"], {
    api: async () => { if (fail) throw new Error("offline"); return {}; },
  });
  context.queueFocusUpdate("completed-session", { status: "completed", actualSeconds: 1500 });
  await context.flushPendingFocusUpdates();
  assert.equal(JSON.parse(context.localStorage.getItem("focusIslandPendingFocusUpdatesV1")).length, 1);
  fail = false;
  await context.flushPendingFocusUpdates();
  assert.equal(JSON.parse(context.localStorage.getItem("focusIslandPendingFocusUpdatesV1")).length, 0);
});

test("login paints the island without waiting for historical imports or duplicate auth reads", async () => {
  let rendered = false;
  const context = harness(["completeAuthenticatedFlow"], {
    claimPendingLifetimeInvite: async () => {},
    getAccessStatus: async () => { assert.fail("login already returned authoritative access"); },
    importLocalHistory: () => new Promise(() => {}),
    flushPendingFocusUpdates: async () => {},
    render() { rendered = true; },
  });
  await context.completeAuthenticatedFlow({ userId: "user-a", developer: false, access: { authenticated: true, canEnterProduct: true } });
  assert.equal(rendered, true);
  assert.equal(context.state.view, "island");
  assert.equal((await context.onlineIdentityPromise).userId, "user-a");
});

test("public assets and API routes never trigger proxy Auth refresh, signed-in documents still do", async () => {
  const proxySource = await readFile(new URL("../proxy.ts", import.meta.url), "utf8");
  const module = ts.transpileModule(proxySource.replace(/^import .*;$/gm, "").replaceAll("export ", ""), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  let refreshes = 0;
  const context = vm.createContext({
    Headers, crypto: { randomUUID }, process: { env: { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public" } },
    createServerClient: () => ({ auth: { getClaims: async () => { refreshes++; } } }),
    NextResponse: { next: () => ({ headers: new Headers(), cookies: { set() {} } }) },
  });
  vm.runInContext(module, context);
  const request = (pathname) => ({ nextUrl: { pathname }, headers: new Headers(), cookies: { getAll: () => [{ name: "sb-example-auth-token", value: "cookie" }] } });
  for (const path of ["/assets/room.webp", "/assets/music.mp3", "/app.js", "/styles.css", "/api/auth/sign-in", "/api/access/status"]) await context.proxy(request(path));
  assert.equal(refreshes, 0);
  await context.proxy(request("/"));
  assert.equal(refreshes, 1);
});

test("developer diagnostics rejects ordinary accounts before reading any room or session", async () => {
  const route = await readFile(new URL("../app/api/developer/diagnostics/route.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(route.replace(/^import .*;$/gm, "").replaceAll("export ", ""), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  const context = vm.createContext({
    authenticatedSupabase: async () => ({ user: { id: "ordinary-user" }, supabase: new Proxy({}, { get() { assert.fail("unauthorized database read"); } }) }),
    isDeveloper: () => false,
    json: (body, init) => ({ body, status: init?.status || 200 }),
  });
  vm.runInContext(compiled, context);
  assert.equal((await context.GET()).status, 403);
});

test('an in-flight pause cannot swallow a later end, and terminal state wins over delayed resume',async()=>{
 let release;const pause=new Promise(resolve=>{release=resolve;});const sent=[];
 const c=harness(['queueFocusUpdate','flushPendingFocusUpdates'],{api:async(_p,o)=>{const body=JSON.parse(o.body);sent.push(body.status);if(body.status==='paused')await pause;return {};}});
 c.queueFocusUpdate('racing-focus',{status:'paused',actualSeconds:20});const flushing=c.flushPendingFocusUpdates();
 c.queueFocusUpdate('racing-focus',{status:'ended_early',actualSeconds:21});
 c.queueFocusUpdate('racing-focus',{status:'running',actualSeconds:20});release();await flushing;
 assert.deepEqual(sent,['paused','ended_early']);assert.deepEqual(JSON.parse(c.localStorage.getItem('focusIslandPendingFocusUpdatesV1')),[]);
});

test("leaving while cloud session validation is pending cannot recover a seat or timer", async () => {
  let finish; let restores=0;
  const session={client_session_id:"previous-library",status:"paused",scene_id:"library",room_id:"library-01",seat_id:3,timer_mode:25};
  const context=harness(["resolvePreviousFocus"],{
    PUBLIC_CONFIG:{minimalMvp:true},
    api:()=>new Promise(resolve=>{finish=()=>resolve({session});}),
    restoreCloudFocusPlace:async()=>{restores++;},
  });
  context.state.focusRecovery=session;context.state.accessOverlay="focus-recovery";context.state.view="focus";
  const pending=context.resolvePreviousFocus(false);
  context.seatReleaseRevision++;context.state.view="island";context.state.sceneId=null;
  finish();await pending;
  assert.equal(restores,0);assert.equal(context.state.view,"island");assert.equal(context.state.cloudFocusClientId,null);assert.equal(context.state.sessionStartedAt,null);assert.equal(context.state.authPending,false);
});

test("leaving while ending a previous cloud session cannot start a new timer", async () => {
  let finish;let starts=0;
  const context=harness(["resolvePreviousFocus"],{
    PUBLIC_CONFIG:{minimalMvp:true},
    api:()=>new Promise(resolve=>{finish=()=>resolve({});}),
    startFocusFromSeat:async()=>{starts++;return true;},
  });
  context.state.focusRecovery={client_session_id:"previous-library",actual_seconds:120};context.state.accessOverlay="focus-recovery";context.state.view="focus";
  const pending=context.resolvePreviousFocus(true);
  context.seatReleaseRevision++;context.state.view="island";context.state.sceneId=null;
  finish();await pending;
  assert.equal(starts,0);assert.equal(context.state.view,"island");assert.equal(context.state.cloudFocusClientId,null);assert.equal(context.state.sessionStartedAt,null);assert.equal(context.state.authPending,false);
});
