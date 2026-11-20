import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const source = await readFile(new URL('../src/mobile-runtime.js', import.meta.url), 'utf8');
function runtime(href = 'capacitor://localhost/index.html', channel = 'offline-alpha') {
  const sent = [], handlers = [];
  const window = { __FOCUS_ISLAND_CONFIG__: { mobile: { channel } }, fetch: async (...args) => { sent.push(args); return new Response('asset'); } };
  const c = vm.createContext({ window, location: new URL(href), URL, Response, document: { addEventListener: (...args) => handlers.push(args) } });
  vm.runInContext(source, c);
  return { window, sent, handlers };
}

test('offline API calls do not create a fake identity, room or payment success', async () => {
  const r = runtime();
  for (const endpoint of ['/api/auth/session', '/api/auth/anonymous', '/api/scenes/cafe/allocate', '/api/focus/sessions/start', '/api/billing/checkout']) {
    const response = await r.window.fetch(endpoint, { method: 'POST' });
    assert.equal(response.status, 503);
    const body = await response.json(); assert.equal(body.code, 'MOBILE_OFFLINE_ALPHA');
    assert.equal(body.userId, undefined); assert.equal(body.authenticated, undefined);
  }
  assert.equal(r.sent.length, 0);
});

test('external fetches and other custom hosts are blocked, local audio still loads', async () => {
  const r = runtime();
  for (const url of ['https://focusisle.online/api/auth/session', 'https://us.i.posthog.com/i/v0/e/', 'capacitor://other-host/assets/test.mp3']) assert.equal((await r.window.fetch(url)).status, 503);
  assert.equal((await r.window.fetch('/assets/audio/test.mp3')).status, 200);
  assert.equal(r.sent.length, 1);
  assert.equal(r.sent[0][0], '/assets/audio/test.mp3');
});

test('request-object API calls on the browser preview are also blocked', async () => {
  const r = runtime('http://127.0.0.1:4173/index.html');
  assert.equal((await r.window.fetch(new Request('http://127.0.0.1:4173/api/auth/session'))).status, 503);
  assert.equal(r.sent.length, 0);
});

test('offline adapter cannot silently run in a release channel', () => {
  assert.throws(() => runtime('capacitor://localhost/index.html', 'production'), /only valid for offline-alpha/);
});
