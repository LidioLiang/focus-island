import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../src/preference-sync.js', import.meta.url), 'utf8');
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
function setup(fetchSettings, saveSettings) {
  const context = vm.createContext({}); vm.runInContext(source, context);
  const data = new Map(), applied = [], states = [];
  const manager = context.MobilePreferenceSync.create({ storage: { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) }, fetchSettings, saveSettings, apply: settings => applied.push(JSON.parse(JSON.stringify(settings))), status: value => states.push(value) });
  return { manager, applied, states, data };
}
test('late A cloud result cannot apply to B after switching accounts', async () => {
  const a = deferred(); const { manager, applied } = setup(owner => owner === 'A' ? a.promise : Promise.resolve({ userId: 'B', settings: { reduceMotion: false }, version: 3 }), () => { throw Error('unexpected write'); });
  const old = manager.select('A', true); await manager.select('B', true);
  const before = JSON.stringify(applied); a.resolve({ userId: 'A', settings: { reduceMotion: true }, version: 1 }); await old;
  assert.equal(JSON.stringify(applied), before); assert.equal(applied.at(-1).reduceMotion, false);
});
test('offline edits persist, merge untouched remote fields, and retry a version conflict', async () => {
  let offline = true, conflict = true, version = 2, remote = { reduceMotion: false, hudAutoHide: true }, writes = 0;
  const { manager, applied, states } = setup(async owner => { if (offline) throw Error('offline'); return { userId: owner, settings: remote, version }; }, async (owner, settings, expected) => {
    writes++; assert.equal(expected, version);
    if (conflict) { conflict = false; remote = { ...remote, hudAutoHide: false }; version++; throw Error('preferences_conflict'); }
    remote = settings; return { userId: owner, version: ++version };
  });
  await manager.select('A', true, { reduceMotion: false }); manager.edit({ reduceMotion: true }); await manager.sync(); assert.equal(states.at(-1), 'pending');
  offline = false; await manager.sync(); assert.equal(writes, 2); assert.deepEqual(applied.at(-1), { reduceMotion: true, hudAutoHide: false }); assert.equal(states.at(-1), 'synced');
});
test('edits made while a save is in flight are not lost', async () => {
  const gate = deferred(); let version = 1, writes = 0, remote = { reduceMotion: false };
  const { manager, states } = setup(async userId => ({ userId, settings: remote, version }), async (userId, settings) => { writes++; if (writes === 1) await gate.promise; remote = settings; return { userId, version: ++version }; });
  await manager.select('A', true); manager.edit({ reduceMotion: true }); const pending = manager.sync();
  await new Promise(r => setImmediate(r)); manager.edit({ reduceMotion: false, hudAutoHide: false }); gate.resolve(); await pending;
  assert.equal(writes, 2); assert.equal(remote.reduceMotion, false); assert.equal(remote.hudAutoHide, false); assert.equal(states.at(-1), 'synced');
});
test('scene settings merge by room and device permissions never upload', async () => {
  const { manager, applied } = setup(async userId => ({ userId, settings: { sceneViews: { cafe: 'window', forest: 'fern' } }, version: 0 }), async (userId) => ({ userId, version: 1 }));
  await manager.select('A', false, { sceneViews: { cafe: 'window' } }); manager.edit({ sceneViews: { cafe: 'bar' }, desktopNotifications: true, token: 'private' });
  await manager.select('A', true); assert.deepEqual(applied.at(-1), { sceneViews: { cafe: 'bar', forest: 'fern' } });
});
