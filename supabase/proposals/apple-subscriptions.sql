-- Release candidate, NOT applied. Promote using `supabase migration new` after a disposable database test.
-- Keep Sandbox purchase tests out of production/web entitlements.
create table public.apple_subscriptions (
  environment text not null check (environment in ('Production', 'Sandbox')),
  original_transaction_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_id text not null,
  product_id text not null,
  active boolean not null,
  expires_at timestamptz not null,
  signed_at timestamptz not null,
  checked_at timestamptz not null,
  primary key (environment, original_transaction_id)
);
alter table public.apple_subscriptions enable row level security;
revoke all on public.apple_subscriptions from public, anon, authenticated;
grant all on public.apple_subscriptions to service_role;

create function public.apply_apple_subscription(p_snapshot jsonb, p_checked_at timestamptz)
returns void language plpgsql security invoker set search_path = public as $$
declare
  previous public.apple_subscriptions;
  v_environment text := p_snapshot->>'environment';
  v_original text := p_snapshot->>'originalTransactionId';
  v_user uuid := (p_snapshot->>'userId')::uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('apple:' || v_environment || ':' || v_original, 0));
  select * into previous from public.apple_subscriptions
    where environment = v_environment and original_transaction_id = v_original for update;
  if found then
    if previous.user_id <> v_user then raise exception 'purchase_account_mismatch'; end if;
    if previous.checked_at > p_checked_at then return; end if;
  end if;
  insert into public.apple_subscriptions values (
    v_environment, v_original, v_user, p_snapshot->>'transactionId', p_snapshot->>'productId',
    (p_snapshot->>'active')::boolean, (p_snapshot->>'expiresAt')::timestamptz,
    (p_snapshot->>'signedAt')::timestamptz, p_checked_at
  ) on conflict (environment, original_transaction_id) do update set
    transaction_id = excluded.transaction_id, product_id = excluded.product_id,
    active = excluded.active, expires_at = excluded.expires_at,
    signed_at = excluded.signed_at, checked_at = excluded.checked_at;
  if v_environment = 'Production' then
    insert into public.entitlements(user_id, entitlement_key, source_type, source_id, active, expires_at)
    values (v_user, 'focus_core_access', 'subscription', 'apple:' || v_original,
      (p_snapshot->>'active')::boolean, (p_snapshot->>'expiresAt')::timestamptz)
    on conflict (user_id, entitlement_key, source_type, source_id) do update set
      active = excluded.active, expires_at = excluded.expires_at, updated_at = now();
  end if;
end;
$$;
revoke all on function public.apply_apple_subscription(jsonb,timestamptz) from public, anon, authenticated;
grant execute on function public.apply_apple_subscription(jsonb,timestamptz) to service_role;
