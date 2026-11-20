import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

const source = name => readFile(new URL('../supabase/' + name, import.meta.url), 'utf8');
const initial = await source('migrations/20261030000100_accounts_focus_billing.sql');
const unmetered = await source('migrations/20261110042616_minimal_companion_guest_focus.sql');
const forest = await source('migrations/20261111025523_forest_shared_scene.sql');
const section = (text, start, end) => text.slice(text.indexOf(start), text.indexOf(end, text.indexOf(start)));
const fn = (text, name) => { const start = text.indexOf('create or replace function public.' + name + '('); return text.slice(start, text.indexOf('$$;', start) + 3); };
const A = '00000000-0000-4000-8000-000000000001', B = '00000000-0000-4000-8000-000000000002', G = '00000000-0000-4000-8000-000000000003';

test('Postgres: trial consumption, preferences isolation, Apple refunds and replay protection', async t => {
  const db = await PGlite.create();
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key,is_anonymous boolean default false,raw_app_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
      insert into auth.users(id,is_anonymous) values ('${A}',false),('${B}',false),('${G}',true);
      create function public.claim_my_closed_beta_slot() returns void language sql as $$select$$;
      create table public.room_instances(room_id text,scene_id text,enabled boolean);
      create table public.seat_leases(user_id uuid,room_id text,seat_id integer,state text,expires_at timestamptz);
      ${section(initial,'create table public.user_access_state','create table public.billing_customers')}
      ${section(initial,'create table public.subscriptions','create table public.billing_transactions')}
      ${section(initial,'create table public.entitlements','create table public.billing_events')}
      ${fn(unmetered,'get_my_access_status')}
      ${fn(forest,'start_my_focus_session')}
      grant all on all tables in schema public to service_role;`);
    await db.exec(await source('migrations/20261120042853_ios_release_access_preferences.sql'));
    await db.exec(await source('migrations/20261113044729_password_recovery_grants.sql'));
    await db.exec(await source('migrations/20261120043738_recovery_session_single_use.sql'));
    const asUser = async id => { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]); await db.exec('set role authenticated'); };
    const start = id => db.query("select public.start_my_focus_session($1,'cafe','cafe-local',1,25) result", [id]);
    await t.test('disabled gate preserves current guest beta; enabled trial is single-use and retry-safe', async () => {
      await asUser(G); assert.equal((await start('guest-session')).rows[0].result.session.is_trial, false);
      await db.exec('reset role; update public.product_release_policy set trial_gate_enabled=true');
      await asUser(G); await assert.rejects(start('another-guest-session'), /registration_required/);
      await asUser(A);
      const first = (await start('trial-session-a')).rows[0].result;
      assert.equal(first.session.is_trial, true);
      assert.equal((await start('trial-session-a')).rows[0].result.session.id, first.session.id);
      await assert.rejects(start('second-trial'), /payment_required/);
      await assert.rejects(db.query("select public.start_my_focus_session_unmetered('bypass','cafe','cafe-local',1,25)"), /permission denied/);
      await asUser(B); await assert.rejects(db.query("select public.start_my_focus_session('trial-50','cafe','cafe-local',1,50)"), /trial_requires_25/);
      assert.equal((await db.query('select public.get_my_access_status() result')).rows[0].result.trialStatus, 'available');
    });
    await t.test('a consumed recovery session cannot mint a second password reset grant', async () => {
      await db.exec('reset role');
      await db.query("insert into public.password_recovery_grants(token_hash,user_id,session_id,expires_at,consumed_at) values('first',$1,$2,now()+interval '10 minutes',now())", [A,B]);
      await assert.rejects(db.query("insert into public.password_recovery_grants(token_hash,user_id,session_id,expires_at) values('replayed',$1,$2,now()+interval '10 minutes')", [A,B]), /duplicate key/);
    });
    await t.test('preference updates enforce owner, compare version and prohibit direct writes', async () => {
      await asUser(A);
      const saved = await db.query("select public.save_my_preferences('{\"reduceMotion\":true}',0) result");
      assert.equal(saved.rows[0].result.version, 1);
      await assert.rejects(db.query("select public.save_my_preferences('{}',0)"), /preferences_conflict/);
      await assert.rejects(db.query("update public.user_preferences set version=100"), /permission denied/);
      await asUser(B); assert.equal((await db.query('select * from public.user_preferences')).rows.length, 0);
      await asUser(G); await assert.rejects(db.query("select public.save_my_preferences('{}',0)"), /registration_required/);
    });
    await t.test('an Apple transaction cannot move accounts or revive after a newer refund; sandbox is isolated', async () => {
      await db.exec('reset role; set role service_role');
      const snapshot = { userId: A, originalTransactionId: 'apple-1', transactionId: 'txn-1', productId: 'online.focusisle.plus.monthly', environment: 'Production', active: true, expiresAt: '2099-01-01T00:00:00Z', signedAt: '2026-11-20T00:00:00Z' };
      const apply = (patch, time) => db.query('select public.apply_apple_subscription($1::jsonb,$2::timestamptz)', [JSON.stringify({ ...snapshot, ...patch }), time]);
      await apply({}, '2026-11-20T00:01:00Z');
      await assert.rejects(apply({ userId: B }, '2026-11-20T00:02:00Z'), /purchase_account_mismatch/);
      await apply({ active: false }, '2026-11-20T00:03:00Z');
      await apply({}, '2026-11-20T00:02:00Z');
      assert.equal((await db.query("select active from public.entitlements where source_id='apple:apple-1'")).rows[0].active, false);
      await apply({ environment: 'Sandbox', originalTransactionId: 'sandbox-1' }, '2026-11-20T00:04:00Z');
      assert.equal((await db.query("select * from public.entitlements where source_id='apple:sandbox-1'")).rows.length, 0);
      await asUser(A); await assert.rejects(db.query('select * from public.apple_subscriptions'), /permission denied/);
    });
  } finally { await db.close(); }
});
