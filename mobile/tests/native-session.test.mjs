import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../src/native-session.js', import.meta.url), 'utf8');
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
function setup() {
  const calls = [], listeners = {}, events = {}, storage = new Map();
  const state = { view: 'room', isRunning: false, sessionPhase: 'focus', timerMode: 25, remainingSeconds: 1500, sessionStartedAt: null, sounds: { music: true, ambient: true, white: false }, soundVolumes: { music: 24, ambient: 55, white: 30 }, musicTrack: 'rainy-notes' };
  const native = { sync: async value => { calls.push(JSON.parse(JSON.stringify(value.state))); }, restore: async () => ({ journal: null }), addListener: (event, callback) => { listeners[event] = callback; } };
  const context = vm.createContext({ window: { Capacitor: { isNativePlatform: () => true, registerPlugin: () => native } }, document: { hidden: false, addEventListener: (event, callback) => { events[event] = callback; } }, state, lastTick: 100000, preferences: { desktopNotifications: true, completionSound: true }, FOCUS_MUSIC_TRACKS: { 'rainy-notes': { src: '/assets/audio/music.mp3' } }, MUSIC_VOLUME_BOOST: 1, focusSceneDefinition: () => ({}), STORAGE_KEYS: { activeSession: 'active' }, localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) }, focusHistory: { owner: () => 'A' }, showToast: () => {}, stopAudio: () => {}, updateAudio: () => {}, updateMusicAudio: () => {}, syncSceneAmbience: () => {}, suspendAudio: () => {}, persistActiveSession: () => {}, resetTimerState: () => {}, syncTimerFromClock: () => {}, recoverCafeSeat: async () => {}, setHistoryIdentity: () => {}, clearSignedInHistory: () => {}, onlineUserId: null, render: () => {}, restoreActiveSession: () => {} });
  vm.runInContext(source, context); return { context, calls, state, storage, listeners, events };
}
test('entering a room is silent; countdown music continues across room and background transitions', async () => {
  const { context, state, calls } = setup(); await flush(); assert.equal(calls.at(-1).running, false); assert.deepEqual(calls.at(-1).channels, []);
  state.isRunning = true; state.sessionStartedAt = 100; state.view = 'focus'; context.updateAudio(); await flush();
  assert.equal(calls.at(-1).deadline, 1600000); assert.equal(calls.at(-1).channels.length, 2);
  state.view = 'room'; context.document.hidden = true; context.suspendAudio(); await flush();
  assert.equal(calls.at(-1).running, true); assert.equal(calls.at(-1).channels[0].id, 'music');
});
test('pause cancels the deadline and sound; completion removes the recovery record', async () => {
  const { context, state, calls, storage } = setup(); await flush();
  state.isRunning = true; state.sessionStartedAt = 100; storage.set('active', '{"ownerUserId":"A"}'); context.persistActiveSession(true); await flush(); assert.ok(calls.at(-1).journal);
  state.isRunning = false; context.updateAudio(); await flush(); assert.equal(calls.at(-1).deadline, null); assert.deepEqual(calls.at(-1).channels, []);
  state.sessionStartedAt = null; state.view = 'summary'; context.stopAudio(); await flush(); assert.equal(calls.at(-1).journal, null);
});
test('queued snapshots preserve start then pause ordering', async () => {
  const { context, state, calls } = setup(); await flush();
  state.isRunning = true; context.updateAudio(); state.isRunning = false; context.updateAudio(); await flush();
  assert.equal(calls.at(-2).running, true); assert.equal(calls.at(-1).running, false);
});
test('native recovery waits for account identity and never restores another user’s session', async () => {
  const { context, storage } = setup();
  let owner = 'local:guest'; context.focusHistory.owner = () => owner;
  // Test a fresh adapter with a native journal arriving before the network identity.
  context.window.Capacitor.registerPlugin = () => ({ sync: async () => {}, addListener: () => {}, restore: async () => ({ journal: '{"ownerUserId":"A"}' }) });
  vm.runInContext(source, context); await flush(); assert.equal(storage.has('active'), false);
  owner = 'A'; context.setHistoryIdentity({ authenticated: true, userId: 'A' }); await flush(); assert.equal(JSON.parse(storage.get('active')).ownerUserId, 'A');
  const other = setup(); other.context.focusHistory.owner = () => 'B';
  other.context.window.Capacitor.registerPlugin = () => ({ sync: async () => {}, addListener: () => {}, restore: async () => ({ journal: '{"ownerUserId":"A"}' }) });
  vm.runInContext(source, other.context); await flush(); other.context.setHistoryIdentity({ authenticated: true, userId: 'B' }); await flush(); assert.equal(other.storage.has('active'), false);
});
