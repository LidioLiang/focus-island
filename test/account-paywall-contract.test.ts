import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(new URL("../supabase/migrations/20261030000100_accounts_focus_billing.sql", import.meta.url), "utf8");
const v11Migration = await readFile(new URL("../supabase/migrations/20261030000200_v1_1_developer_and_lifetime_invites.sql", import.meta.url), "utf8");
const hardeningMigration = await readFile(new URL("../supabase/migrations/20261030000300_v1_1_security_hardening.sql", import.meta.url), "utf8");
const stripeMigration = await readFile(new URL("../supabase/migrations/20261030090146_v1_1_stripe_billing_provider.sql", import.meta.url), "utf8");
const appSource = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
const stripeSource = await readFile(new URL("../lib/stripe.ts", import.meta.url), "utf8");
const sessionSource = await readFile(new URL("../app/api/auth/session/route.ts", import.meta.url), "utf8");
const proxySource = await readFile(new URL("../proxy.ts", import.meta.url), "utf8");
const webhookSource = await readFile(new URL("../app/api/billing/webhook/route.ts", import.meta.url), "utf8");
const anonymousRoute = await readFile(new URL("../app/api/auth/anonymous/route.ts", import.meta.url), "utf8");
const vercelConfig = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));

test("permanent verified accounts and one atomic 25-minute trial gate product access", () => {
  assert.match(migration, /v_user\.is_anonymous is true/);
  assert.match(migration, /v_user\.email_confirmed_at is null/);
  assert.match(migration, /select \* into v_access from public\.user_access_state where user_id = v_user\.id for update/);
  assert.match(migration, /if p_timer_mode <> 25 then raise exception 'trial_requires_25'/);
  assert.match(migration, /unique \(user_id, client_session_id\)/);
  assert.match(migration, /focus_sessions_one_active_per_user_idx/);
  assert.match(migration, /raise exception 'payment_required'/);
});

test("room allocation and room-session writes enforce access below the UI", () => {
  assert.match(migration, /perform public\.assert_my_product_access\(\)/);
  assert.match(migration, /before insert or update on public\.room_sessions/);
  assert.match(appSource, /await getAccessStatus\(\{ refresh: true \}\)/);
  assert.doesNotMatch(appSource.slice(appSource.indexOf("async function ensureOnlineIdentity"), appSource.indexOf("function currentRoomApiId")), /api\/auth\/anonymous/);
  assert.match(anonymousRoute, /ALLOW_ANONYMOUS_MIGRATION !== "true"/);
});

test("focus records and billing state are private and mutated through RPC or verified webhooks", () => {
  for (const table of ["user_access_state", "focus_sessions", "billing_customers", "subscriptions", "billing_transactions", "entitlements", "billing_events", "account_merge_requests"]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }
  assert.match(migration, /users read own focus sessions/);
  assert.match(webhookSource, /stripeEvent\(rawBody/);
  assert.match(webhookSource, /provider_event_id: event\.id/);
  assert.match(webhookSource, /event_id_payload_mismatch/);
  assert.match(webhookSource, /Date\.parse\(stored\) > Date\.parse\(incoming\)/);
  assert.match(stripeMigration, /check \(provider = 'stripe'\)/);
});

test("paid access uses a signed 72-hour snapshot and North America deployment region", () => {
  assert.match(proxySource, /getClaims\(\)/);
  assert.deepEqual(vercelConfig.regions, ["iad1"]);
  assert.match(appSource, /plus_monthly/);
  assert.match(appSource, /plus_annual/);
  assert.match(appSource, /founder_lifetime/);
  assert.match(appSource, /付款完成后由签名 Webhook 确认权益/);
});

test("v1.1 validates exact Stripe prices and keeps developer tools server-role gated", () => {
  assert.match(stripeSource, /plus_monthly: \{ amount: 499/);
  assert.match(stripeSource, /plus_annual: \{ amount: 1999/);
  assert.match(stripeSource, /founder_lifetime: \{ amount: 3999/);
  assert.match(stripeSource, /billing_price_mismatch/);
  assert.match(webhookSource, /request\.headers\.get\("stripe-signature"\)/);
  assert.match(webhookSource, /checkout\.session\.completed/);
  assert.match(webhookSource, /customer\.subscription\./);
  assert.match(sessionSource, /isDeveloper\(auth\.user\)/);
  assert.match(v11Migration, /raw_app_meta_data->>'role'.*= 'developer'/);
  assert.match(appSource, /state\.isDeveloper \? \[\["developer"/);
  assert.doesNotMatch(appSource, /email\s*===\s*["'][^"']+@/);
});

test("limited lifetime invitation claims are atomic and capped server-side", () => {
  assert.match(v11Migration, /lifetime_invite_campaigns/);
  assert.match(v11Migration, /for update/);
  assert.match(v11Migration, /claimed_count >= v_campaign\.max_claims/);
  assert.match(v11Migration, /unique \(user_id\)/);
  assert.match(v11Migration, /source_type, source_id[\s\S]*'lifetime'/);
  assert.match(appSource, /lifetime_invite/);
});

test("v1.1 hardening removes public helper execution and anonymous history access", () => {
  assert.match(hardeningMigration, /revoke all on function public\.rls_auto_enable\(\) from public, anon, authenticated/);
  assert.match(hardeningMigration, /revoke all on function public\.assert_my_product_access\(\) from authenticated/);
  assert.match(hardeningMigration, /is_anonymous is true then raise exception 'registration_required'/);
  assert.match(hardeningMigration, /email_confirmed_at is null then raise exception 'email_verification_required'/);
  assert.match(hardeningMigration, /account_merge_requests_anonymous_user_idx/);
  assert.match(hardeningMigration, /room_sessions_room_id_idx/);
});
