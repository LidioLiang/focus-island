import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
const styles = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");
const i18nRuntime = await readFile(new URL("../public/i18n.js", import.meta.url), "utf8");
const englishLocale = await readFile(new URL("../public/locales/en.js", import.meta.url), "utf8");
const layoutSource = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
const pageSource = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");

test("English localization initializes after hydration and before the application renders its UI", () => {
  assert.match(layoutSource, /vendor\/i18next\.min\.js/);
  assert.match(layoutSource, /locales\/en\.js/);
  assert.match(layoutSource, /i18n\.js/);
  assert.match(pageSource, /app\.js\?v=40/);
  assert.match(source, /language: \/\^zh\\b\/i\.test\(window\.navigator\.language/);
  assert.match(i18nRuntime, /focusIslandPreferencesV1/);
  assert.match(i18nRuntime, /MutationObserver/);
  assert.match(i18nRuntime, /observer\.disconnect\(\)/);
  assert.match(i18nRuntime, /observer\.takeRecords\(\)/);
  assert.match(i18nRuntime, /translateDocument\(\);\s*observeDocument\(\);/);
  assert.match(layoutSource, /i18n\.js\?v=9" strategy="afterInteractive"/);
  assert.match(layoutSource, /locales\/en\.js\?v=10/);
  assert.match(i18nRuntime, /englishPhrases/);
  assert.match(i18nRuntime, /\$1 focus sessions/);
  assert.match(i18nRuntime, /\$1 records/);
  assert.match(englishLocale, /Local islander room/);
  assert.match(englishLocale, /Library coming soon/);
  assert.match(englishLocale, /Focus data overview/);
  assert.match(englishLocale, /Focus Isle map/);
  assert.match(englishLocale, /US English product copy/);
  assert.match(englishLocale, /Offline room/);
  assert.match(englishLocale, /A virtual focus space\u2014no camera/);
  assert.match(englishLocale, /Your timer is still running\. Return to your session when you’re ready\./);
  assert.match(englishLocale, /Golden Hour/);
  assert.match(englishLocale, /Stillwater/);
  assert.match(layoutSource, /Step into a calm space, pick a seat, and get to work\./);
  assert.match(source, /<p>PROFILE<\/p>/);
  assert.match(englishLocale, /Focus Isle/);
  assert.match(englishLocale, /Privacy Policy/);
  assert.match(englishLocale, /Terms of Service/);
  assert.match(source, /const englishIdentity = window\.FocusI18n\?\.getLanguage\(\) === "en"/);
  assert.match(source, /function localizedIdentityDisplayName/);
  assert.match(source, /\["Otter", "Robin", "Deer", "Traveler"/);
});

test("personal center language switch enables Chinese and English without a disabled placeholder", () => {
  const preferences = source.slice(source.indexOf("function renderPersonalPreferences"), source.indexOf("function renderPersonalAccount"));
  assert.match(preferences, /data-profile-language="zh-CN"/);
  assert.match(preferences, /data-profile-language="en"/);
  assert.doesNotMatch(preferences, /English[^<]*<\/button>[^\n]*disabled/);
  assert.match(source, /FocusI18n\?\.setLanguage\(language\)/);
  assert.match(source, /if \(state\.personalCenter\.open\) renderPersonalCenter\(\)/);
  assert.doesNotMatch(source, /setLanguage\(language, \{ reload: true \}\)/);
});

test("production cafe entry allocates a room and opens the static room", () => {
  assert.match(source, /api\/scenes\/cafe\/allocate/);
  assert.match(source, /state\.view = roomViewForScene\(\)/);
  assert.match(source, /CAFE_ROOM_RENDERER_STATIC = "static"/);
  assert.match(source, /static-seat-room/);
});

test("production cafe room uses the calibrated sunny master and six static occupied-seat overlays", () => {
  assert.match(source, /20261028-cafe-room-static-seat-master\.png/);
  for (let seatId = 1; seatId <= 6; seatId += 1) {
    assert.match(source, new RegExp(`20261028-cafe-seat-0${seatId}-occupied\\.png`));
  }
  assert.match(source, /Coordinates are percentages of the calibrated 1672 × 941 sunny cafe canvas/);
  assert.match(styles, /aspect-ratio: 1672 \/ 941/);
  assert.match(styles, /\.static-seat-occupant\.is-entering \{ animation: static-seat-fade-in 560ms ease both; \}/);
  const occupantRuleStart = styles.indexOf(".static-seat-occupant {");
  const occupantRule = styles.slice(occupantRuleStart, styles.indexOf("}", occupantRuleStart) + 1);
  assert.doesNotMatch(occupantRule, /animation:/);
  assert.match(source, /seat_id: 3, hit_area: \[59\.7, 50\.6908\]/);
  assert.doesNotMatch(styles, /\.static-seat-occupant\.is-mine\s*\{[\s\S]*?drop-shadow/);
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

test("active focus uses a compact bottom-center hover timer with four dock actions", () => {
  const hud = source.slice(source.indexOf("function renderSessionHud"), source.indexOf("function modeButton"));
  assert.match(hud, /class="focus-control-cluster"/);
  assert.match(hud, /class="immersive-timer"/);
  assert.match(hud, /class="focus-control-dock"/);
  assert.equal((hud.match(/class="focus-dock-button/g) || []).length, 4);
  assert.match(hud, /data-action="toggle-timer"/);
  assert.match(hud, /data-action="toggle-session-panel"/);
  assert.match(hud, /data-action="toggle-room-view"/);
  assert.match(hud, /返回房间视角/);
  assert.match(hud, /data-action="finish-session"/);
  assert.doesNotMatch(hud, /session-clock-button/);
  assert.match(styles, /\.focus-control-cluster\s*\{[\s\S]*left: 50%[\s\S]*bottom: max\(18px[\s\S]*transform: translateX\(-50%\)/);
  assert.match(styles, /\.immersive-timer\s*\{[\s\S]*border: 0[\s\S]*background: transparent[\s\S]*box-shadow: none[\s\S]*opacity: 0\.68/);
  assert.match(styles, /\.immersive-timer\s*\{[\s\S]*min-width: 0[\s\S]*padding: 2px 6px/);
  assert.match(styles, /\.immersive-timer small\s*\{[\s\S]*display: none/);
  assert.match(styles, /\.immersive-timer strong\s*\{[\s\S]*font-size: clamp\(23px, 2\.4vw, 34px\)/);
  assert.match(styles, /\.focus-control-dock\s*\{[\s\S]*max-height: 0[\s\S]*opacity: 0/);
  assert.match(styles, /\.focus-control-dock\s*\{[\s\S]*transition-delay: 3s/);
  assert.match(styles, /\.focus-control-cluster:hover \.focus-control-dock,[\s\S]*max-height: 76px[\s\S]*opacity: 1/);
  assert.match(styles, /\.focus-control-cluster:hover \.focus-control-dock,[\s\S]*transition-delay: 0s/);
});

test("static cafe labels are unboxed text and NPC companions stay stable while seats change", () => {
  assert.match(styles, /\.static-seat-label\s*\{[\s\S]*border: 0[\s\S]*background: transparent[\s\S]*box-shadow: none/);
  assert.match(source, /function createLocalNpcLeases/);
  assert.match(source, /shuffledCopy\(staticSeatSlots\.map/);
  assert.match(source, /displayName: nicknames\[index\]/);
  assert.match(source, /state\.localNpcRoster = state\.localRoom \? createLocalNpcLeases\(\) : \[\]/);
  assert.match(source, /const otherLeases = state\.roomPresence\.leases\.filter/);
  assert.match(source, /const entering = mine && state\.awaitingImmersiveFocus/);
  assert.match(source, /\$\{entering \? "is-entering" : ""\}/);
  assert.match(source, /data-static-focus-started-at/);
  assert.match(source, /updateStaticFocusTimes/);
  assert.doesNotMatch(source, /seatId: 2, sessionId: "npc-02"/);
  assert.doesNotMatch(source, /seatId: 4, sessionId: "npc-04"/);
});

test("developer marker calibration is hidden by default and persists only the six static seat numbers", () => {
  const roomStart = source.indexOf("function renderStaticCafeRoom");
  const room = source.slice(roomStart, roomStart + 6500);
  assert.doesNotMatch(room, /开发者 · 调整编号/);
  assert.match(room, /state\.isDeveloper && state\.staticSeatCalibration\.enabled/);
  assert.match(room, /data-action="toggle-static-seat-calibration"/);
  assert.match(room, /data-action="reset-static-seat-markers"/);
  assert.match(room, /staticSeatMarkerPosition\(slot\)/);
  assert.match(room, /renderSeat\(\[markerLeft, markerTop, false\],[\s\S]*staticMarker: true/);
  assert.match(source, /data-static-seat-marker/);
  assert.match(source, /updateStaticSeatMarkerPosition/);
  assert.match(source, /staticSeatMarkerDrag/);
  assert.match(source, /const staticRoom = Boolean\(document\.querySelector\("\.static-seat-room"\)\)/);
  assert.match(source, /staticRoom[\s\S]*renderSeat\(\[markerLeft, markerTop, false\],[\s\S]*staticMarker: true/);
  assert.match(styles, /\.static-seat-room\.is-static-seat-calibration \[data-static-seat-marker\]/);
});

test("the cafe room keeps the same countdown visible after focus has started", () => {
  const roomStart = source.indexOf("function renderStaticCafeRoom");
  const room = source.slice(roomStart, roomStart + 5000);
  assert.match(room, /state\.currentSeatId && state\.sessionStartedAt && !awaitingImmersive \? renderSessionHud\("room"\) : ""/);
  assert.match(room, /class="room-immersive-prompt"/);
  assert.match(room, /data-immersive-countdown/);
});

test("the five-second immersive handoff never overlaps the active session timer", () => {
  const roomStart = source.indexOf("function renderStaticCafeRoom");
  const room = source.slice(roomStart, source.indexOf("function renderRoom()", roomStart));
  const hudIndex = room.indexOf('renderSessionHud("room")');
  const promptIndex = room.indexOf('class="room-immersive-prompt"');
  assert.ok(hudIndex >= 0 && promptIndex > hudIndex);
  assert.match(room.slice(Math.max(0, hudIndex - 120), hudIndex + 80), /!awaitingImmersive/);
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
  assert.match(hud, /focusViewButton\("clearing", "雨后初晴", `\$\{ASSET_BASE\}20261028-cafe-rain-clearing-focus-view\.png`\)/);
  assert.match(hud, /focusViewButton\("lounge"/);
  assert.doesNotMatch(hud, /focusViewButton\("night"/);
  assert.doesNotMatch(hud, /月夜咖啡馆/);
  assert.doesNotMatch(hud, /位真人正在陪伴/);
});

test("the third focus scene is a seated rain-clearing work view instead of the empty cafe master", () => {
  const focusImages = source.slice(source.indexOf("function selectedFocusImage"), source.indexOf("function renderSessionHud"));
  assert.match(focusImages, /clearing: `\$\{ASSET_BASE\}20261028-cafe-rain-clearing-focus-view\.png`/);
  assert.doesNotMatch(focusImages, /晴朗月夜学习场景/);
});

test("the immersive header returns to the room while ending remains in the timer dock", () => {
  const focusView = source.slice(source.indexOf("function renderFocus"), source.indexOf("function scheduleHudFade"));
  const hud = source.slice(source.indexOf("function renderSessionHud"), source.indexOf("function modeButton"));
  const returnHandler = source.slice(source.indexOf('if (action === "return-room-view")'), source.indexOf('if (action === "toggle-room-view")'));
  assert.match(focusView, /class="focus-exit-button"[\s\S]*data-action="return-room-view"[\s\S]*aria-label="返回房间"/);
  assert.match(focusView, /<strong>返回房间<\/strong>/);
  assert.doesNotMatch(focusView, /class="focus-exit-button"[\s\S]*data-action="finish-session"/);
  assert.match(returnHandler, /state\.view = "room"/);
  assert.match(returnHandler, /renderRoom\(\)/);
  assert.doesNotMatch(returnHandler, /finishSession/);
  assert.match(hud, /data-action="finish-session"[\s\S]*<small>结束<\/small>/);
});

test("sound choices update in place without rerendering the settings panel", () => {
  const handler = source.slice(source.indexOf('const soundButtonElement = event.target.closest("[data-sound]")'), source.indexOf('const focusViewButtonElement = event.target.closest("[data-focus-view]")'));
  assert.match(handler, /querySelectorAll\("\[data-sound\]"\)/);
  assert.doesNotMatch(handler, /renderFocus\(\)/);
  assert.doesNotMatch(handler, /renderRoom\(\)/);
});

test("idle focus mode keeps the bottom-center countdown visible while hover controls stay available", () => {
  const idleStart = styles.indexOf("body.hud-idle .focus .focus-header");
  const idleRule = styles.slice(idleStart, styles.indexOf("\n.focus-header {", idleStart));
  assert.doesNotMatch(idleRule, /focus-control-dock/);
  assert.match(idleRule, /body\.hud-idle \.focus \.immersive-timer[\s\S]*opacity: 1/);
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

test("four supplied focus music tracks use versioned Storage paths", () => {
  const expectedTracks = [
    ["rainy-notes", "雨夜手札"],
    ["warm-reverie", "暖灯漫想"],
    ["moonlit-walk", "月光缓行"],
    ["island-breeze", "岛屿长风"],
  ];
  for (const [slug, name] of expectedTracks) {
    assert.match(source, new RegExp(`"${slug}"`));
    assert.match(source, new RegExp(name));
    assert.match(source, new RegExp(`AUDIO_BASE}20261028-focus-music-${slug}\\.mp3`));
  }
  assert.match(source, /PUBLIC_CONFIG\.audioBaseUrl/);
  assert.match(source, /const MUSIC_VOLUME_BOOST = 1\.3/);
  assert.match(source, /soundVolumes\.music \/ 100 \* MUSIC_VOLUME_BOOST/);
});

test("mute immediately silences both generated ambience channels and pauses music", () => {
  const hardMute = source.slice(source.indexOf("function muteAllAudioImmediately"), source.indexOf("function suspendAudio"));
  const soundHandler = source.slice(source.indexOf('const soundButtonElement = event.target.closest("[data-sound]")'), source.indexOf('const focusViewButtonElement = event.target.closest("[data-focus-view]")'));
  assert.match(hardMute, /cancelScheduledValues\(now\)/);
  assert.match(hardMute, /setValueAtTime\(0, now\)/);
  assert.match(hardMute, /musicAudio\?\.pause\(\)/);
  assert.match(soundHandler, /key === "mute"\) muteAllAudioImmediately\(\)/);
});

test("profile choices use dedicated transparent portrait assets instead of seated character art", () => {
  const avatars = source.slice(source.indexOf("const AVATAR_OPTIONS"), source.indexOf("let preferences"));
  for (const file of ["warm-light", "quiet", "morning-mist", "moonlit"]) {
    assert.match(avatars, new RegExp(`20261028-profile-avatar-${file}\\.png`));
  }
  assert.doesNotMatch(avatars, /cafe-avatar-seat-/);
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

test("sitting down prepares the saved timer and keeps the room visible for the immersive handoff", () => {
  const seatFlow = source.slice(source.indexOf("async function occupySelectedSeat"), source.indexOf("function renderFocus"));
  assert.match(seatFlow, /state\.timerMode = preferences\.defaultTimerMode/);
  assert.match(seatFlow, /state\.durationSeconds = Math\.max\(0, state\.timerMode \* 60\)/);
  assert.match(seatFlow, /state\.sessionPanelOpen = false/);
  assert.match(seatFlow, /beginImmersiveAutoEnter\(\)/);
  assert.match(seatFlow, /renderRoom\(\)/);
  assert.doesNotMatch(seatFlow, /CAFE_STATE_LAYER_SETTLE_MS/);
  assert.doesNotMatch(seatFlow, /state\.sessionPanelOpen = true/);
});

test("static cafe handoff removes the large footer, waits five seconds and offers immediate entry", () => {
  const staticRoom = source.slice(source.indexOf("function renderStaticCafeRoom"), source.indexOf("function renderRoom()"));
  const handoff = source.slice(source.indexOf("function immersiveCountdownSeconds"), source.indexOf("function stopRoomPresence"));
  assert.doesNotMatch(staticRoom, /class="room-footer"/);
  assert.match(staticRoom, /class="room-immersive-prompt"/);
  assert.match(staticRoom, /data-action="enter-immersive-focus"/);
  assert.match(source, /const CAFE_IMMERSIVE_AUTO_ENTER_MS = 5000/);
  assert.match(handoff, /beginImmersiveAutoEnter/);
  assert.match(handoff, /enterImmersiveFocus\(\)/);
  assert.match(handoff, /className = "focus-transition-preview"/);
  assert.match(styles, /\.focus-transition-preview[\s\S]*transition: opacity 1400ms/);
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
