import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { readFile } from "node:fs/promises";

const analyticsSource = await readFile(new URL("../public/analytics.js", import.meta.url), "utf8");
const appSource = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
const sceneSource = await readFile(new URL("../public/scene-runtime.js", import.meta.url), "utf8");

function analyticsHarness(initialStorage = {}) {
  const values = new Map(Object.entries(initialStorage));
  const requests = [];
  const timers = [];
  const document = {
    readyState: "complete",
    addEventListener() {},
    querySelector() { return null; },
    createElement() { return { className: "", dataset: {}, setAttribute() {}, remove() {}, innerHTML: "" }; },
    body: { appendChild() {} },
  };
  const window = {
    __FOCUS_ANALYTICS_CONFIG__: {
      projectToken: "phc_test",
      apiHost: "https://us.i.posthog.com",
      appVersion: "1.6.3",
      environment: "test",
    },
    doNotTrack: "0",
    setTimeout(callback) { timers.push(callback); return timers.length; },
  };
  window.window = window;
  const context = vm.createContext({
    window,
    document,
    navigator: { doNotTrack: "0" },
    location: { origin: "https://focusisle.online", host: "focusisle.online", pathname: "/", search: "?utm_source=reddit&code=private-oauth-code" },
    localStorage: {
      getItem(key) { return values.get(key) ?? null; },
      setItem(key, value) { values.set(key, String(value)); },
      removeItem(key) { values.delete(key); },
    },
    crypto: { randomUUID: (() => { let index = 0; return () => `00000000-0000-4000-8000-${String(++index).padStart(12, "0")}`; })() },
    fetch(url, options) { requests.push({ url, options }); return Promise.resolve({ ok: true }); },
    URLSearchParams,
    Date,
    Math,
    Object,
    String,
    Number,
    Boolean,
    Set,
    JSON,
  });
  vm.runInContext(analyticsSource, context);
  return { analytics: window.FocusAnalytics, requests, timers, values };
}

test("analytics requires consent and accepts only the five product events", () => {
  const denied = analyticsHarness();
  assert.equal(denied.analytics.capture("focus_started", { scene_id: "cafe" }), false);
  assert.equal(denied.requests.length, 0);

  const allowed = analyticsHarness({ focusIsleAnalyticsConsentV1: "granted" });
  assert.equal(allowed.analytics.capture("unknown_event", { scene_id: "cafe" }), false);
  assert.equal(allowed.analytics.capture("focus_started", { scene_id: "cafe", seat_id: 2, room_type: "online", timer_mode: 25, email: "private@example.com", task_text: "secret" }), true);
  const payload = JSON.parse(allowed.requests.at(-1).options.body);
  assert.equal(payload.event, "focus_started");
  assert.equal(payload.properties.scene_id, "cafe");
  assert.equal(payload.properties.seat_id, 2);
  assert.equal(payload.properties.$current_url, "https://focusisle.online/");
  assert.equal(payload.properties.$process_person_profile, false);
  assert.equal("email" in payload.properties, false);
  assert.equal("task_text" in payload.properties, false);
  assert.doesNotMatch(JSON.stringify(payload), /private-oauth-code/);
});

test("identify links the anonymous ID without sending profile PII and developer traffic is suppressed", () => {
  const regular = analyticsHarness({ focusIsleAnalyticsConsentV1: "granted" });
  assert.equal(regular.analytics.identify("user-123", { is_anonymous: false, is_developer: false, email: "private@example.com" }), true);
  const identifyPayload = JSON.parse(regular.requests.at(-1).options.body);
  assert.equal(identifyPayload.event, "$identify");
  assert.equal(identifyPayload.properties.distinct_id, "user-123");
  assert.match(identifyPayload.properties.$anon_distinct_id, /^[0-9a-f-]+$/);
  assert.deepEqual(JSON.parse(JSON.stringify(identifyPayload.properties.$set)), { account_type: "permanent", is_developer: false });
  assert.doesNotMatch(JSON.stringify(identifyPayload), /private@example.com/);

  const developer = analyticsHarness({ focusIsleAnalyticsConsentV1: "granted" });
  assert.equal(developer.analytics.identify("developer-1", { is_anonymous: false, is_developer: true }), false);
  assert.equal(developer.analytics.capture("scene_selected", { scene_id: "cafe" }), false);
  assert.equal(developer.requests.length, 0);
});

test("the product flow emits the complete cold-start funnel", () => {
  for (const eventName of ["seat_confirmed", "focus_started", "focus_finished"]) {
    assert.match(appSource, new RegExp(`captureProductEvent\\(\\"${eventName}\\"|${eventName === "focus_started" ? "trackFocusStarted\\(" : eventName === "focus_finished" ? "trackFocusFinished\\(" : "$^"}`));
  }
  assert.match(sceneSource, /captureProductEvent\('scene_selected'/);
  assert.match(analyticsSource, /landing_viewed/);
  assert.doesNotMatch(analyticsSource, /posthog\.init|recording_enabled|autocapture\s*:/i);
});
