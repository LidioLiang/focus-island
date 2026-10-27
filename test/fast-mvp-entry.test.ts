import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");

test("production cafe entry allocates a room and opens the static room", () => {
  assert.match(source, /api\/scenes\/cafe\/allocate/);
  assert.match(source, /state\.view = roomViewForScene\(\)/);
  assert.match(source, /CAFE_ROOM_RENDERER_STATIC = "static"/);
  assert.match(source, /static-seat-room/);
});

test("cafe production view defaults to static and only exposes an internal 3D opt-in", () => {
  assert.match(source, /CAFE_ROOM_RENDERER_STATIC = "static"/);
  assert.match(source, /return stored === CAFE_ROOM_RENDERER_GODOT_3D[\s\S]*CAFE_ROOM_RENDERER_STATIC/);
  assert.match(source, /CAFE_ROOM_RENDERER_QUERY_KEY = "roomRenderer"/);
  assert.doesNotMatch(source, /if \(state\.sceneId === "cafe"\) enterGodot/);
});

test("timer choices are limited to 25, 50 and free count-up", () => {
  const hud = source.slice(source.indexOf("function renderSessionHud"), source.indexOf("function modeButton"));
  assert.match(hud, /modeButton\(25/);
  assert.match(hud, /modeButton\(50/);
  assert.match(hud, /modeButton\(0/);
  assert.doesNotMatch(hud, /modeButton\(-1/);
});

test("immersive focus uses a centered timer and exactly three dock actions", () => {
  const hud = source.slice(source.indexOf("function renderSessionHud"), source.indexOf("function modeButton"));
  assert.match(hud, /class="immersive-timer"/);
  assert.match(hud, /class="focus-control-dock"/);
  assert.equal((hud.match(/class="focus-dock-button/g) || []).length, 3);
  assert.match(hud, /data-action="toggle-timer"/);
  assert.match(hud, /data-action="toggle-session-panel"/);
  assert.match(hud, /data-action="finish-session"/);
  assert.doesNotMatch(hud, /session-clock-button/);
  assert.doesNotMatch(hud, /toggle-room-view/);
});

test("centered focus settings expose timer, sound and scene options", () => {
  const hud = source.slice(source.indexOf("function renderSessionHud"), source.indexOf("function modeButton"));
  assert.match(hud, /计时选项/);
  assert.match(hud, /声音设置/);
  assert.match(hud, /场景设置/);
  assert.equal((hud.match(/class="session-setting-group"/g) || []).length, 3);
  assert.doesNotMatch(hud, /class="sound-subheading"/);
  assert.match(hud, /focusViewButton\("window"/);
  assert.match(hud, /focusViewButton\("bar"/);
  assert.match(hud, /focusViewButton\("night"/);
  assert.match(hud, /focusViewButton\("lounge"/);
  assert.doesNotMatch(hud, /位真人正在陪伴/);
});

test("sound choices update in place without rerendering the settings panel", () => {
  const handler = source.slice(source.indexOf('const soundButtonElement = event.target.closest("[data-sound]")'), source.indexOf('const focusViewButtonElement = event.target.closest("[data-focus-view]")'));
  assert.match(handler, /querySelectorAll\("\[data-sound\]"\)/);
  assert.doesNotMatch(handler, /renderFocus\(\)/);
  assert.doesNotMatch(handler, /renderRoom\(\)/);
});

test("idle focus mode keeps the countdown visible while hiding the controls", () => {
  const idleRule = styles.slice(styles.indexOf("body.hud-idle .focus .focus-header"), styles.indexOf(".focus-header {"));
  assert.match(idleRule, /focus-control-dock/);
  assert.match(idleRule, /body\.hud-idle \.focus \.immersive-timer[\s\S]*opacity: 0\.58/);
  assert.doesNotMatch(idleRule, /immersive-timer[\s\S]*opacity: 0;/);
});

test("clicking blank space outside the focus settings closes the panel", () => {
  const clickHandler = source.slice(source.indexOf('document.addEventListener("click"'), source.indexOf('const sceneButton = event.target.closest("[data-scene]")'));
  assert.match(clickHandler, /state\.view === "focus"/);
  assert.match(clickHandler, /state\.sessionPanelOpen/);
  assert.match(clickHandler, /!event\.target\.closest\("\.session-control-panel"\)/);
  assert.match(clickHandler, /!event\.target\.closest\("\[data-action\]"\)/);
  assert.match(clickHandler, /state\.sessionPanelOpen = false/);
  assert.match(clickHandler, /renderFocus\(\)/);
});

test("four supplied focus music tracks use the versioned audio base", () => {
  const expectedTracks = [
    ["rainy-notes", "雨夜手札"],
    ["warm-reverie", "暖灯漫想"],
    ["moonlit-walk", "月光缓行"],
    ["island-breeze", "岛屿长风"],
  ];
  for (const [slug, name] of expectedTracks) {
    assert.match(source, new RegExp(`"${slug}"`));
    assert.match(source, new RegExp(name));
    assert.match(source, new RegExp(`AUDIO_BASE}20261022-focus-music-${slug}\\.mp3`));
  }
  assert.match(source, /PUBLIC_CONFIG\.audioBaseUrl/);
  assert.match(source, /const MUSIC_VOLUME_BOOST = 1\.3/);
  assert.match(source, /soundVolumes\.music \/ 100 \* MUSIC_VOLUME_BOOST/);
});

test("sound and scene choices use expandable horizontal thumbnail rails", () => {
  const hud = source.slice(source.indexOf("function renderSessionHud"), source.indexOf("function modeButton"));
  const muteOptionIndex = hud.indexOf('soundButton("mute"');
  const firstMusicOptionIndex = hud.indexOf("Object.entries(FOCUS_MUSIC_TRACKS)");
  const ambientOptionIndex = hud.indexOf('soundButton("ambient"');
  assert.ok(muteOptionIndex >= 0 && muteOptionIndex < firstMusicOptionIndex);
  assert.ok(firstMusicOptionIndex < ambientOptionIndex);
  assert.match(source, /class="sound-option-thumbnail"/);
  assert.match(styles, /\.focus-scene-grid,[\s\S]*\.environment-sound-grid[\s\S]*overflow-x: auto/);
  assert.match(styles, /scroll-snap-type: inline mandatory/);
});

test("cafe ambient sound has an audible gain preset", () => {
  assert.match(source, /const CAFE_AMBIENT_GAIN = 0\.09/);
  assert.match(source, /CAFE_AMBIENT_GAIN \* state\.soundVolumes\.ambient/);
});

test("completion summary uses the island background and preserves every exit action", () => {
  const summary = source.slice(source.indexOf("function renderSummary"), source.indexOf("function getSummaryCopy"));
  assert.match(summary, /summary-island-background/);
  assert.match(summary, /summary-streak-badge/);
  assert.match(summary, /data-feedback/);
  assert.match(summary, /data-action="retry-session"/);
  assert.match(summary, /data-action="return-room"/);
  assert.match(summary, /data-action="return-island"/);
  assert.match(styles, /\.summary-card[\s\S]*backdrop-filter: blur\(28px\)/);
  assert.match(styles, /\.summary-actions[\s\S]*grid-template-columns: minmax\(150px/);
});

test("sitting down enters focus with the saved default timer and closed settings", () => {
  const seatFlow = source.slice(source.indexOf("async function occupySelectedSeat"), source.indexOf("function renderFocus"));
  assert.match(seatFlow, /state\.timerMode = preferences\.defaultTimerMode/);
  assert.match(seatFlow, /state\.durationSeconds = Math\.max\(0, state\.timerMode \* 60\)/);
  assert.match(seatFlow, /state\.sessionPanelOpen = false/);
  assert.match(seatFlow, /if \(!fromSeatId\) startFocusFromSeat\(\)/);
  assert.doesNotMatch(seatFlow, /state\.sessionPanelOpen = true/);
});

test("completed 25 or 50 minute sessions enter an in-scene rest stage", () => {
  const focusView = source.slice(source.indexOf("function renderFocus"), source.indexOf("function scheduleHudFade"));
  const finishFlow = source.slice(source.indexOf("async function finishSession"), source.indexOf("function notifyFocusComplete"));
  assert.match(focusView, /state\.sessionPhase === "rest"/);
  assert.match(focusView, /renderRestStage\(\)/);
  assert.match(focusView, /data-focus-scene-image/);
  assert.doesNotMatch(source, /state\.view = "rest"/);
  assert.match(finishFlow, /\[25, 50\]\.includes\(state\.timerMode\)/);
  assert.match(finishFlow, /notifyFocusComplete\(\)/);
  assert.match(finishFlow, /beginRestStage\(state\.timerMode\)/);
});

test("rest stage defaults to five minutes and supports presets, custom duration and skip", () => {
  const restStage = source.slice(source.indexOf("function renderRestStage"), source.indexOf("function formatRestTime"));
  assert.match(source, /const DEFAULT_REST_MINUTES = 5/);
  assert.match(source, /const REST_PRESET_MINUTES = \[5, 10, 15\]/);
  assert.match(restStage, /叮 · 本轮专注已完成/);
  assert.match(restStage, /data-rest-minutes="custom"/);
  assert.match(restStage, /data-rest-custom-input/);
  assert.match(restStage, /data-action="skip-rest"/);
  assert.match(restStage, /休息结束后自动开始下一轮/);
});

test("rest countdown automatically starts a fresh focus session without releasing the seat", () => {
  const restSync = source.slice(source.indexOf("function syncRestTimerFromClock"), source.indexOf("function stopTicker"));
  const nextFocus = source.slice(source.indexOf("function startNextFocusSession"), source.indexOf("function notifyFocusComplete"));
  assert.match(restSync, /startNextFocusSession\(\)/);
  assert.match(nextFocus, /state\.sessionPhase = "focus"/);
  assert.match(nextFocus, /state\.isRunning = true/);
  assert.match(nextFocus, /state\.sessionStartedAt = Date\.now\(\)/);
  assert.match(nextFocus, /persistActiveSession\(true\)/);
  assert.doesNotMatch(nextFocus, /releaseSeat/);
});

test("focus completion plays a two-tone chime", () => {
  const completionSound = source.slice(source.indexOf("function notifyFocusComplete"), source.indexOf("function buildSessionResult"));
  assert.match(completionSound, /523\.25/);
  assert.match(completionSound, /659\.25/);
  assert.match(completionSound, /createOscillator\(\)/);
});
