import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const rules = await readFile(new URL('../src/scene-rotation.js', import.meta.url), 'utf8');
const ui = await readFile(new URL('../src/mobile-experience.js', import.meta.url), 'utf8');
const context = vm.createContext({});
vm.runInContext(rules, context);
const Rotation = vm.runInContext('MobileSceneRotation', context);

function setup() {
  let time = 0, id = 0;
  const jobs = new Map(), selected = [];
  const state = { sceneId: 'library', active: true, enabled: true, current: 'window',
    views: [{ id: 'window' }, { id: 'hidden', hidden: true }, { id: 'reading' }, { id: 'alcove' }] };
  const controller = Rotation.create({ read: () => state, select: next => { state.current = next; selected.push(next); },
    schedule: (fn, delay) => { jobs.set(++id, { at: time + delay, fn }); return id; }, cancel: id => jobs.delete(id) });
  function advance(ms) {
    const end = time + ms;
    for (;;) {
      const next = [...jobs].filter(([, j]) => j.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      jobs.delete(next[0]); time = next[1].at; next[1].fn();
    }
    time = end;
  }
  return { state, selected, jobs, controller, advance };
}

test('automatic scenes wait five minutes, skip hidden views and wrap exactly once', () => {
  const r = setup(); r.controller.sync();
  for (let i = 0; i < 20; i++) r.controller.sync();
  assert.equal(r.jobs.size, 1);
  r.advance(299999); assert.deepEqual(r.selected, []);
  r.advance(1); assert.deepEqual(r.selected, ['reading']);
  r.advance(600000); assert.deepEqual(r.selected, ['reading', 'alcove', 'window']);
});
test('manual navigation wraps both ways and restarts the complete five-minute interval', () => {
  const r = setup(); r.controller.sync(); r.advance(290000);
  r.controller.step(-1); assert.equal(r.state.current, 'alcove');
  r.advance(299999); assert.deepEqual(r.selected, ['alcove']);
  r.advance(1); assert.equal(r.state.current, 'window');
});
test('switch off stops automatic rotation without disabling manual swipes', () => {
  const r = setup(); r.controller.sync();
  r.state.enabled = false; r.controller.sync(); r.advance(900000);
  assert.deepEqual(r.selected, []); assert.equal(r.jobs.size, 0);
  r.controller.step(1); assert.equal(r.state.current, 'reading'); assert.equal(r.jobs.size, 0);
  r.state.enabled = true; r.controller.sync(); r.advance(299999); assert.equal(r.state.current, 'reading');
  r.advance(1); assert.equal(r.state.current, 'alcove');
});
test('leaving focus, backgrounding or opening a panel pauses and returning gets a fresh interval', () => {
  const r = setup(); r.controller.sync(); r.advance(200000);
  r.state.active = false; r.controller.sync(); r.advance(900000);
  assert.equal(r.controller.step(1), false); assert.deepEqual(r.selected, []);
  r.state.active = true; r.controller.sync(); r.advance(299999); assert.deepEqual(r.selected, []);
  r.advance(1); assert.equal(r.state.current, 'reading');
});
test('late timer cannot advance a different room or a newly selected view', () => {
  const r = setup(); r.controller.sync();
  r.state.sceneId = 'forest'; r.state.current = 'root'; r.state.views = [{ id: 'root' }, { id: 'mist' }];
  r.advance(300000); assert.deepEqual(r.selected, []);
  r.advance(300000); assert.deepEqual(r.selected, ['mist']);
  r.state.views = [{ id: 'mist' }]; r.controller.sync(); assert.equal(r.jobs.size, 0);
});
test('swipe recognition rejects taps, vertical drags, tiny jitter and long holds', () => {
  const start = { x: 200, y: 100, time: 0 };
  assert.equal(Rotation.swipeDirection(start, { x: 100, y: 112, time: 400 }), 1);
  assert.equal(Rotation.swipeDirection(start, { x: 300, y: 112, time: 400 }), -1);
  for (const end of [{x:205,y:100,time:80}, {x:220,y:200,time:400}, {x:250,y:155,time:400}, {x:300,y:100,time:1500}]) {
    assert.equal(Rotation.swipeDirection(start, end), 0);
  }
});

function experience(saved = {}) {
  const events = new Map(), pageEvents = new Map(), audio = [];
  const audioCalls = { update: 0, suspend: 0, ambience: 0, silence: 0 };
  class Audio {
    constructor(src) { this.src = src; this.paused = true; this.dataset = {}; audio.push(this); }
    play() { this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
    remove() { this.removed = true; }
  }
  const preferences = { sounds: { music: false }, sceneAudio: { cafe: { sounds: { music: false } }, forest: { sounds: { music: false } } }, ...saved };
  const state = { view: 'room', sceneId: 'cafe', sounds: { music: false }, soundVolumes: { music: 24 }, musicTrack: 'soft', personalCenter: {}, isRunning: false };
  const document = { hidden: false, body: { appendChild() {} }, querySelector() { return null; }, getElementById() { return null; },
    addEventListener(name, fn) { events.set(name, [...(events.get(name) || []), fn]); } };
  const c = vm.createContext({ Audio, document, preferences, state, Date, setTimeout, clearTimeout,
    window: { addEventListener(name, fn) { pageEvents.set(name, fn); } },
    minimalUi: {}, musicAudio: null, loadedMusicTrack: null, MUSIC_VOLUME_BOOST: 1,
    FOCUS_MUSIC_TRACKS: { soft: { src: '/assets/audio/soft.mp3' }, other: { src: '/assets/audio/other.mp3' } },
    defaultPreferences: () => ({ sounds: { ambient: true, music: false } }), savePreferences() {},
    saveSoundPreferencesFromState() {}, stopAudio() {}, updateMusicAudio() {},
    minimalHeader: () => '<nav class="scene-tools">old</nav>', minimalTool: () => 'avatar',
    minimalTimerMarkup() {}, minimalRenderPanel() {}, minimalShell() {}, minimalRenderConfirm() {},
    focusSceneDefinition: () => ({ focusViews: [] }), render() {},
    rememberSceneFocusView() {}, selectedFocusImage: () => '/scene.png', persistActiveSession() {},
    minimalIcon: name => `<svg data-icon="${name}"></svg>`, formatTime: () => '25:00', formatRestTime: () => '05:00' });
  c.updateAudio = () => { audioCalls.update++; c.updateMusicAudio(); };
  c.suspendAudio = () => { audioCalls.suspend++; c.musicAudio?.pause(); };
  c.syncSceneAmbience = async () => { audioCalls.ambience++; };
  c.silenceSceneAmbience = () => { audioCalls.silence++; };
  vm.runInContext(rules + '\n' + ui, c);
  return { c, preferences, state, document, audio, events, pageEvents, audioCalls };
}
test('upgrade enables music in all saved rooms once, later user-off and auto-off persist', () => {
  const r = experience(); assert.equal(r.state.sounds.music, true);
  assert.equal(r.preferences.autoSceneSwitch, true);
  assert.ok(Object.values(r.preferences.sceneAudio).every(a => a.sounds.music));
  assert.equal(r.c.defaultPreferences().sounds.music, true);
  const restored = experience({ mobileExperienceVersion: 1, autoSceneSwitch: false, sounds: { music: false } });
  assert.equal(restored.state.sounds.music, false); assert.equal(restored.preferences.autoSceneSwitch, false);
});
test('music starts with the timer and continues in the room using the same player', () => {
  const r = experience(); r.c.updateAudio(); r.c.updateMusicAudio();
  assert.equal(r.audio.length, 0); assert.equal(r.audioCalls.update, 0);
  r.state.view = 'focus'; r.c.updateAudio(); r.c.updateMusicAudio();
  assert.equal(r.audio.length, 0); assert.equal(r.audioCalls.update, 0);
  r.state.isRunning = true; r.c.updateAudio();
  assert.equal(r.audio.length, 1); assert.equal(r.audio[0].paused, false);
  r.state.isRunning = false; r.c.updateAudio(); assert.equal(r.audio[0].paused, true);
  r.c.updateMusicAudio(); assert.equal(r.audio[0].paused, true);
  r.state.isRunning = true; r.c.updateAudio(); assert.equal(r.audio[0].paused, false);
  r.state.sounds.music = false; r.c.saveSoundPreferencesFromState(); assert.equal(r.audio[0].paused, true);
  r.state.sounds.music = true; r.c.saveSoundPreferencesFromState(); assert.equal(r.audio[0].paused, false);
  r.document.hidden = true; r.events.get('visibilitychange')[0](); assert.equal(r.audio[0].paused, true);
  r.document.hidden = false; r.events.get('visibilitychange')[0](); assert.equal(r.audio[0].paused, false);
  r.state.view = 'island'; r.c.updateMusicAudio(); assert.equal(r.audio[0].paused, true);
  r.state.view = 'room'; r.c.updateAudio(); r.c.updateMusicAudio(); assert.equal(r.audio[0].paused, false);
  assert.equal(r.audio.length, 1);
  r.state.isRunning = false; r.c.updateAudio(); assert.equal(r.audio[0].paused, true);
  r.state.isRunning = true; r.c.updateAudio(); assert.equal(r.audio[0].paused, false);
  r.state.view = 'focus'; r.state.musicTrack = 'other'; r.c.saveSoundPreferencesFromState();
  assert.equal(r.audio.length, 2); assert.equal(r.audio[0].removed, true); assert.equal(r.audio[1].paused, false);
  r.pageEvents.get('pagehide')(); assert.equal(r.audio[1].paused, true);
});
test('ambience waits for the timer, continues in the room and mutes in background', async () => {
  const r = experience();
  await r.c.syncSceneAmbience(); assert.equal(r.audioCalls.ambience, 0);
  r.state.view = 'focus'; await r.c.syncSceneAmbience(); assert.equal(r.audioCalls.ambience, 0);
  r.state.isRunning = true; await r.c.syncSceneAmbience(); assert.equal(r.audioCalls.ambience, 1);
  r.state.view = 'room'; await r.c.syncSceneAmbience(); assert.equal(r.audioCalls.ambience, 2);
  r.document.hidden = true; await r.c.syncSceneAmbience(); assert.equal(r.audioCalls.ambience, 2);
  assert.equal(r.audioCalls.silence, 3);
});
test('focus toolbar always has six icon-only controls with accessible labels, including local fallback', () => {
  const r = experience(); r.state.view = 'focus';
  for (const options of [{}, { isRunning: true }, { sessionStartedAt: 1 }, { offlineStartAvailable: true }, { sessionPhase: 'rest' }]) {
    Object.assign(r.state, { isRunning: false, sessionStartedAt: null, offlineStartAvailable: false, sessionPhase: 'focus' }, options);
    const html = r.c.minimalTimerMarkup();
    assert.equal((html.match(/<button /g) || []).length, 6);
    assert.equal((html.match(/aria-label="(?:Scene|Sound|Settings)"/g) || []).length, 3);
    for (const [, body] of html.matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)) assert.match(body, /^<svg[^>]*><\/svg>$/);
  }
  assert.doesNotMatch(r.c.minimalHeader('focus'), /old/);
});
test('pointer wiring ignores controls and multiple fingers but switches background swipes without swallowing the next toolbar tap', () => {
  const r = experience({ autoSceneSwitch: false });
  r.state.view = 'focus'; r.state.focusImageChoice = 'one';
  r.c.focusSceneDefinition = () => ({ focusViews: [{ id: 'one' }, { id: 'two' }] });
  const background = { closest: selector => selector.includes('.world') ? {} : null };
  const control = { closest: selector => selector.startsWith('button,') ? {} : null };
  const emit = (name, event) => r.events.get(name).forEach(fn => fn(event));
  const down = (target, id = 1) => emit('pointerdown', { target, pointerId: id, button: 0, clientX: 300, clientY: 100, timeStamp: 100 });
  const up = (id = 1) => emit('pointerup', { pointerId: id, clientX: 100, clientY: 105, timeStamp: 400 });
  down(control); up(); assert.equal(r.state.focusImageChoice, 'one');
  down(background); down(background, 2); up(); up(2); assert.equal(r.state.focusImageChoice, 'one');
  down(background); up(); assert.equal(r.state.focusImageChoice, 'two');
  let blocked = false;
  emit('click', { target: control, preventDefault() { blocked = true; }, stopImmediatePropagation() {} });
  assert.equal(blocked, false);
  emit('click', { target: background, preventDefault() { blocked = true; }, stopImmediatePropagation() {} });
  assert.equal(blocked, true);
});
