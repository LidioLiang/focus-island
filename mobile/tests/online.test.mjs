import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../src/mobile-online.js', import.meta.url), 'utf8');
function setup(native = true) {
  const calls = [];
  const window = { __FOCUS_ISLAND_CONFIG__: { mobile: { channel: 'online-beta' } },
    fetch: async () => new Response('asset'),
    Capacitor: { isNativePlatform: () => native, registerPlugin: () => ({ request: async args => { calls.push(args); return { status: 200, body: { ok: true } }; } }) } };
  vm.runInNewContext(source, { window, Request, Response, URL, DOMException, location: new URL('capacitor://localhost/index.html') });
  return { window, calls };
}
test('online auth uses the native transport without exposing tokens', async () => {
  const { window, calls } = setup();
  await window.fetch('/api/auth/sign-in', { method: 'POST', body: JSON.stringify({ email: 'test@example.com', password: 'not-a-real-password' }) });
  assert.equal(calls[0].path, '/api/mobile/auth/sign-in');
  assert.equal(calls[0].method, 'POST');
  assert.equal(calls[0].accessToken, undefined);
});
test('cloud requests retain the expected owner and pagination', async () => {
  const { window, calls } = setup();
  await window.fetch('/api/focus/sessions?offset=100', { headers: { 'X-Focus-User': 'account-a' } });
  assert.equal(calls[0].owner, 'account-a');
  assert.equal(calls[0].path, '/api/focus/sessions?offset=100');
});
test('online transport refuses foreign origins, browser fallback and aborted mutations', async () => {
  const { window, calls } = setup();
  await assert.rejects(window.fetch('https://evil.example/api/account'), /External requests/);
  const abort = new AbortController(); abort.abort();
  await assert.rejects(window.fetch('/api/account', { method: 'DELETE', signal: abort.signal }), /aborted/);
  assert.equal(calls.length, 0);
  await assert.rejects(setup(false).window.fetch('/api/auth/session'), /Native networking/);
});
