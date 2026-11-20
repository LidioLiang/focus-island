import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import ts from 'typescript';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../lib/presence.ts', import.meta.url), 'utf8');
const ast = ts.createSourceFile('presence.ts', source, ts.ScriptTarget.Latest, true);
const declaration = ast.statements.find(n => ts.isFunctionDeclaration(n) && n.name?.text === 'authenticatedSupabase');
const js = ts.transpileModule(declaration.getText(ast).replace('export ', ''), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
const { bearerToken } = await import('../lib/bearer-auth.ts');
function context(header, valid = true) {
  const calls = [];
  const user = { id: 'native-account' };
  const c = vm.createContext({ bearerToken, process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable' } },
    headers: async () => ({ get: () => header }),
    createClient: (url, key, options) => { calls.push({ url, key, options }); return { auth: { getUser: async token => { calls.push(token); return { data: { user: valid ? user : null }, error: valid ? null : new Error('invalid token') }; } } }; },
    createServerSupabaseClient: async () => { calls.push('cookie'); return { auth: { getUser: async () => ({ data: { user: { id: 'cookie-account' } }, error: null }) } }; } });
  vm.runInContext(js, c);
  return { c, calls };
}
test('native identity is validated by Supabase and RLS receives that same token', async () => {
  const { c, calls } = context('Bearer aaa.bbb.ccc');
  const auth = await c.authenticatedSupabase();
  assert.equal(auth.user.id, 'native-account');
  assert.equal(calls[0].key, 'publishable');
  assert.equal(calls[0].options.global.headers.Authorization, 'Bearer aaa.bbb.ccc');
  assert.equal(calls[1], 'aaa.bbb.ccc');
  assert.ok(!calls.includes('cookie'));
});
test('invalid or expired native tokens never borrow a valid browser cookie identity', async () => {
  for (const header of ['Basic abc', 'Bearer aaa.bbb.ccc']) {
    const { c, calls } = context(header, false);
    assert.equal(await c.authenticatedSupabase(), null);
    assert.ok(!calls.includes('cookie'));
  }
});
test('existing web requests retain their cookie-based identity', async () => {
  const { c, calls } = context(null);
  assert.equal((await c.authenticatedSupabase()).user.id, 'cookie-account');
  assert.deepEqual(calls, ['cookie']);
});
