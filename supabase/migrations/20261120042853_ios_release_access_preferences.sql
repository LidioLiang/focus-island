-- Native release foundation; all commercial switches remain disabled.

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

-- Additive release controls. Trial gating stays OFF until the complete billing release is validated.
create table public.product_release_policy (
  singleton boolean primary key default true check (singleton),
  trial_gate_enabled boolean not null default false
);
insert into public.product_release_policy values (true, false);
alter table public.product_release_policy enable row level security;
revoke all on public.product_release_policy from public, anon, authenticated;
grant all on public.product_release_policy to service_role;

alter function public.get_my_access_status() rename to get_my_access_status_unmetered;
alter function public.start_my_focus_session(text,text,text,integer,integer) rename to start_my_focus_session_unmetered;
revoke all on function public.get_my_access_status_unmetered(), public.start_my_focus_session_unmetered(text,text,text,integer,integer) from public, anon, authenticated;

create function public.get_my_access_status() returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare result jsonb; available boolean; active_trial boolean;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  result := public.get_my_access_status_unmetered();
  if not (select trial_gate_enabled from public.product_release_policy where singleton) then
    return result || jsonb_build_object('trialGateEnabled',false);
  end if;
  available := result->>'trialStatus' = 'available';
  select exists(select 1 from public.focus_sessions f join public.user_access_state a on a.trial_session_id=f.id
    where f.user_id=auth.uid() and a.user_id=auth.uid() and f.status in ('running','paused')
      and f.started_at + interval '35 minutes' > now()) into active_trial;
  return result || jsonb_build_object('trialGateEnabled',true,'trialMinutes',25,
    'canEnterProduct', available or active_trial or result->>'entitlementType'<>'none',
    'canStartFocus', result->>'accountType'='permanent' and (available or result->>'entitlementType'<>'none'),
    'paywallReason', case when result->>'accountType'<>'permanent' then 'registration_required'
      when available or result->>'entitlementType'<>'none' then null else 'payment_required' end);
end;
$$;

create function public.start_my_focus_session(
  p_client_session_id text,p_scene_id text,p_room_id text,p_seat_id integer,p_timer_mode integer
) returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare result jsonb; access jsonb; existing public.focus_sessions; trial public.user_access_state;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if not (select trial_gate_enabled from public.product_release_policy where singleton) then
    return public.start_my_focus_session_unmetered(p_client_session_id,p_scene_id,p_room_id,p_seat_id,p_timer_mode);
  end if;
  if not exists(select 1 from auth.users where id=auth.uid() and is_anonymous is not true) then raise exception 'registration_required'; end if;
  insert into public.user_access_state(user_id) values(auth.uid()) on conflict(user_id) do nothing;
  select * into trial from public.user_access_state where user_id=auth.uid() for update;
  select * into existing from public.focus_sessions where user_id=auth.uid() and client_session_id=p_client_session_id;
  -- An idempotent retry/resume keeps its original trial; the underlying function verifies all parameters.
  if found then return public.start_my_focus_session_unmetered(p_client_session_id,p_scene_id,p_room_id,p_seat_id,p_timer_mode); end if;
  access := public.get_my_access_status_unmetered();
  if access->>'entitlementType'='none' then
    if trial.trial_status <> 'available' then raise exception 'payment_required'; end if;
    if p_timer_mode is distinct from 25 then raise exception 'trial_requires_25'; end if;
  end if;
  result := public.start_my_focus_session_unmetered(p_client_session_id,p_scene_id,p_room_id,p_seat_id,p_timer_mode);
  if access->>'entitlementType'='none' then
    update public.focus_sessions set is_trial=true where id=(result->'session'->>'id')::uuid and user_id=auth.uid();
    update public.user_access_state set trial_status='consumed',trial_session_id=(result->'session'->>'id')::uuid,
      trial_started_at=now(),trial_consumed_at=now(),updated_at=now() where user_id=auth.uid();
    result := jsonb_set(result,'{session,is_trial}','true'::jsonb);
  end if;
  return result;
end;
$$;
revoke all on function public.get_my_access_status(), public.start_my_focus_session(text,text,text,integer,integer) from public, anon;
grant execute on function public.get_my_access_status(), public.start_my_focus_session(text,text,text,integer,integer) to authenticated;

create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}' check (jsonb_typeof(settings)='object' and octet_length(settings::text)<=20000),
  version integer not null default 0 check (version >= 0),
  updated_at timestamptz not null default now()
);
alter table public.user_preferences enable row level security;
revoke all on public.user_preferences from public, anon, authenticated;
grant select on public.user_preferences to authenticated;
create policy "read own preferences" on public.user_preferences for select to authenticated using ((select auth.uid())=user_id);

create function public.save_my_preferences(p_settings jsonb,p_expected_version integer)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare current_row public.user_preferences;
begin
  if auth.uid() is null or not exists(select 1 from auth.users where id=auth.uid() and is_anonymous is not true) then raise exception 'registration_required'; end if;
  if p_expected_version is null or p_expected_version<0 or p_settings is null or jsonb_typeof(p_settings)<>'object' or octet_length(p_settings::text)>20000 then raise exception 'invalid_preferences'; end if;
  insert into public.user_preferences(user_id) values(auth.uid()) on conflict(user_id) do nothing;
  select * into current_row from public.user_preferences where user_id=auth.uid() for update;
  if current_row.version<>p_expected_version then raise exception 'preferences_conflict'; end if;
  update public.user_preferences set settings=p_settings,version=version+1,updated_at=now()
    where user_id=auth.uid() returning * into current_row;
  return jsonb_build_object('settings',current_row.settings,'version',current_row.version);
end;
$$;
revoke all on function public.save_my_preferences(jsonb,integer) from public,anon;
grant execute on function public.save_my_preferences(jsonb,integer) to authenticated;
