import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import { z } from 'zod';
import { randomBytes, createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { recoverySession, RECOVERY_COOKIE, RECOVERY_SECONDS } from '../lib/password-recovery.ts';
const source = await readFile(new URL('../app/mobile/recover/route.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('route.ts', source, ts.ScriptTarget.Latest, true);
const fn = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === 'POST');
const js = ts.transpileModule(fn.getText(ast).replace('export ', ''), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
function setup(method = 'recovery', duplicate = false) {
  const calls = [];
  const claims = { sub: 'user-a', session_id: 'verified-session', is_anonymous: false, amr: [{ method, timestamp: Date.now() / 1000 }] };
  const auth = { getUser: async () => ({ data: { user: { id: 'user-a' } }, error: null }), getClaims: async () => ({ data: { claims }, error: null }) };
  const ctx = vm.createContext({ z, randomBytes, sha256: value => createHash('sha256').update(value).digest('hex'), Date, recoverySession, RECOVERY_COOKIE, RECOVERY_SECONDS, process: { env: { MOBILE_AUTH_ENABLED: 'true' } }, URL, json: (value, init) => Response.json(value, init), rateLimited: () => false, createClient: () => ({ auth }), createServerSupabaseClient: async () => ({ auth: { ...auth, setSession: async () => { calls.push('session'); return { data: { user: { id: 'user-a' }, session: { access_token: 'verified' } }, error: null }; } } }), createAdminSupabaseClient: () => ({ from: () => ({ insert: async values => { calls.push(values); return { error: duplicate ? new Error('unique constraint') : null }; } }) }), cookies: async () => ({ set: (...args) => calls.push(args) }) });
  vm.runInContext(js, ctx);
  const request = origin => new Request('https://focusisle.online/mobile/recover', { method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ accessToken: 'verified-jwt', refreshToken: 'refresh' }) });
  return { ctx, calls, request };
}
test('mobile reset rejects foreign origins before processing credentials', async () => {
  const { ctx, calls, request } = setup(); assert.equal((await ctx.POST(request('https://other.invalid'))).status, 403); assert.equal(calls.length, 0);
});
test('a normal signed-in JWT cannot create a password-reset grant', async () => {
  const { ctx, calls, request } = setup('password'); assert.equal((await ctx.POST(request('https://focusisle.online'))).status, 403); assert.equal(calls.length, 0);
});
test('only a fresh verified recovery session creates an HttpOnly single-use grant', async () => {
  const { ctx, calls, request } = setup(); assert.equal((await ctx.POST(request('https://focusisle.online'))).status, 200);
  const cookie = calls.find(Array.isArray); assert.equal(cookie[0], RECOVERY_COOKIE); assert.equal(cookie[2].httpOnly, true); assert.equal(cookie[2].secure, true); assert.equal(cookie[2].path, '/api/auth/password/recover');
  const repeated = setup('recovery', true); assert.equal((await repeated.ctx.POST(repeated.request('https://focusisle.online'))).status, 403); assert.ok(!repeated.calls.some(Array.isArray));
});
