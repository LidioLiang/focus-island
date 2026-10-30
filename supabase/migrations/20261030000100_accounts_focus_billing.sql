create table public.user_access_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  trial_status text not null default 'available' check (trial_status in ('available', 'in_progress', 'consumed')),
  trial_session_id uuid,
  trial_started_at timestamptz,
  trial_consumed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_session_id text not null check (char_length(client_session_id) between 8 and 160),
  scene_id text not null check (char_length(scene_id) between 1 and 40),
  room_id text check (room_id is null or char_length(room_id) between 1 and 80),
  seat_id smallint check (seat_id is null or seat_id between 1 and 100),
  timer_mode smallint not null check (timer_mode in (0, 25, 50)),
  planned_seconds integer not null check (planned_seconds between 0 and 86400),
  actual_seconds integer not null default 0 check (actual_seconds between 0 and 86400),
  paused_seconds integer not null default 0 check (paused_seconds between 0 and 86400),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  status text not null default 'running' check (status in ('running', 'paused', 'completed', 'ended_early', 'interrupted')),
  is_trial boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, client_session_id)
);

create unique index focus_sessions_one_active_per_user_idx
  on public.focus_sessions (user_id)
  where status in ('running', 'paused');
create index focus_sessions_user_started_idx on public.focus_sessions (user_id, started_at desc);

create table public.billing_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'paddle' check (provider = 'paddle'),
  provider_customer_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  provider_subscription_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  price_id text not null,
  plan_key text not null check (plan_key in ('plus_monthly', 'plus_annual')),
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  provider_occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_user_idx on public.subscriptions (user_id);

create table public.billing_transactions (
  provider_transaction_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_subscription_id text,
  price_id text not null,
  plan_key text not null check (plan_key in ('plus_monthly', 'plus_annual', 'founder_lifetime')),
  status text not null,
  amount text,
  currency text,
  refunded_at timestamptz,
  provider_occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index billing_transactions_user_idx on public.billing_transactions (user_id);

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entitlement_key text not null check (entitlement_key = 'focus_core_access'),
  source_type text not null check (source_type in ('subscription', 'lifetime', 'admin')),
  source_id text not null,
  active boolean not null default true,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, entitlement_key, source_type, source_id)
);
create index entitlements_user_active_idx on public.entitlements (user_id, active, expires_at);

create table public.billing_events (
  provider_event_id text primary key,
  event_type text not null,
  occurred_at timestamptz not null,
  payload_sha256 text not null,
  status text not null default 'processing' check (status in ('processing', 'processed', 'failed', 'ignored')),
  error text,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.account_merge_requests (
  id uuid primary key default gen_random_uuid(),
  anonymous_user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.user_access_state enable row level security;
alter table public.focus_sessions enable row level security;
alter table public.billing_customers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.billing_transactions enable row level security;
alter table public.entitlements enable row level security;
alter table public.billing_events enable row level security;
alter table public.account_merge_requests enable row level security;

revoke all on public.user_access_state, public.focus_sessions, public.billing_customers,
  public.subscriptions, public.billing_transactions, public.entitlements,
  public.billing_events, public.account_merge_requests from anon, authenticated;

grant select on public.focus_sessions to authenticated;
create policy "users read own focus sessions" on public.focus_sessions for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.get_my_access_status()
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_user auth.users;
  v_access public.user_access_state;
  v_entitlement public.entitlements;
  v_subscription public.subscriptions;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into v_user from auth.users where id = auth.uid();
  if not found then raise exception 'authentication_required'; end if;
  if v_user.is_anonymous is true then
    return jsonb_build_object(
      'authenticated', true, 'emailVerified', false, 'accountType', 'anonymous',
      'trialStatus', 'unavailable', 'entitlementType', 'none',
      'subscriptionStatus', null, 'canEnterProduct', false, 'canStartFocus', false,
      'paywallReason', 'registration_required'
    );
  end if;
  if v_user.email_confirmed_at is null then
    return jsonb_build_object(
      'authenticated', true, 'emailVerified', false, 'accountType', 'permanent',
      'trialStatus', 'unavailable', 'entitlementType', 'none',
      'subscriptionStatus', null, 'canEnterProduct', false, 'canStartFocus', false,
      'paywallReason', 'email_verification_required'
    );
  end if;

  insert into public.user_access_state (user_id) values (v_user.id)
    on conflict (user_id) do nothing;
  select * into v_access from public.user_access_state where user_id = v_user.id;
  select * into v_entitlement from public.entitlements
    where user_id = v_user.id and entitlement_key = 'focus_core_access' and active
      and (expires_at is null or expires_at > now())
    order by case source_type when 'lifetime' then 1 when 'subscription' then 2 else 3 end
    limit 1;
  if v_entitlement.source_type = 'subscription' then
    select * into v_subscription from public.subscriptions
      where provider_subscription_id = v_entitlement.source_id limit 1;
  end if;
  return jsonb_build_object(
    'authenticated', true,
    'emailVerified', true,
    'accountType', 'permanent',
    'trialStatus', v_access.trial_status,
    'entitlementType', coalesce(v_entitlement.source_type, 'none'),
    'subscriptionStatus', v_subscription.status,
    'canEnterProduct', true,
    'canStartFocus', v_entitlement.id is not null or v_access.trial_status in ('available', 'in_progress'),
    'paywallReason', case when v_entitlement.id is null and v_access.trial_status = 'consumed' then 'payment_required' else null end
  );
end;
$$;

create or replace function public.assert_my_product_access()
returns void language plpgsql security definer set search_path = public, auth as $$
declare v_status jsonb;
begin
  v_status := public.get_my_access_status();
  if coalesce((v_status->>'canStartFocus')::boolean, false) is not true then
    if v_status->>'paywallReason' = 'payment_required' then raise exception 'payment_required'; end if;
    raise exception 'registration_required';
  end if;
end;
$$;

create or replace function public.allocate_room(
  p_scene_id text, p_session_id uuid, p_display_name text, p_avatar_skin integer
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user_id uuid := auth.uid(); v_room_id text; v_reconnected boolean := false;
begin
  perform public.assert_my_product_access();
  if p_scene_id <> 'cafe' then raise exception 'room_not_found'; end if;
  perform public.cleanup_expired_leases();
  perform public.upsert_my_profile(p_display_name, p_avatar_skin);
  select room_id into v_room_id from public.room_sessions
    where id = p_session_id and user_id = v_user_id and lease_expires_at > now() limit 1;
  if v_room_id is not null then v_reconnected := true;
  else
    select r.room_id into v_room_id
    from public.room_instances r
    left join public.seat_leases l on l.room_id = r.room_id and l.expires_at > now()
    where r.scene_id = p_scene_id and r.enabled
    group by r.room_id, r.capacity
    having count(l.seat_id) < r.capacity
    order by count(l.seat_id) desc, r.room_id asc
    limit 1;
  end if;
  if v_room_id is null then
    return jsonb_build_object('mode', 'local', 'roomId', 'cafe-local', 'reason', 'system_rooms_full');
  end if;
  return jsonb_build_object('mode', 'online', 'roomId', v_room_id, 'reconnected', v_reconnected);
end;
$$;

create or replace function public.enforce_room_session_access()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.assert_my_product_access();
  return new;
end;
$$;

create trigger enforce_room_session_access_before_write
before insert or update on public.room_sessions
for each row execute function public.enforce_room_session_access();

create or replace function public.start_my_focus_session(
  p_client_session_id text, p_scene_id text, p_room_id text, p_seat_id integer, p_timer_mode integer
) returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_user auth.users;
  v_access public.user_access_state;
  v_existing public.focus_sessions;
  v_entitled boolean;
  v_trial boolean := false;
  v_planned integer;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if char_length(p_client_session_id) not between 8 and 160 or p_timer_mode not in (0,25,50) then
    raise exception 'invalid_focus_session';
  end if;
  select * into v_user from auth.users where id = auth.uid();
  if not found or v_user.is_anonymous is true then raise exception 'registration_required'; end if;
  if v_user.email_confirmed_at is null then raise exception 'email_verification_required'; end if;

  select * into v_existing from public.focus_sessions
    where user_id = v_user.id and client_session_id = p_client_session_id;
  if found then return jsonb_build_object('session', to_jsonb(v_existing), 'resumed', true); end if;
  if exists(select 1 from public.focus_sessions where user_id = v_user.id and status in ('running','paused')) then
    raise exception 'active_session_exists';
  end if;

  insert into public.user_access_state (user_id) values (v_user.id)
    on conflict (user_id) do nothing;
  select * into v_access from public.user_access_state where user_id = v_user.id for update;
  select exists(
    select 1 from public.entitlements where user_id = v_user.id
      and entitlement_key = 'focus_core_access' and active
      and (expires_at is null or expires_at > now())
  ) into v_entitled;

  if not v_entitled then
    if v_access.trial_status = 'available' then
      if p_timer_mode <> 25 then raise exception 'trial_requires_25'; end if;
      v_trial := true;
    elsif v_access.trial_status = 'in_progress' then
      raise exception 'active_session_exists';
    else
      raise exception 'payment_required';
    end if;
  end if;

  v_planned := case when p_timer_mode = 0 then 0 else p_timer_mode * 60 end;
  insert into public.focus_sessions (
    user_id, client_session_id, scene_id, room_id, seat_id, timer_mode, planned_seconds, is_trial
  ) values (
    v_user.id, p_client_session_id, p_scene_id, nullif(p_room_id,''), p_seat_id, p_timer_mode, v_planned, v_trial
  ) returning * into v_existing;

  if v_trial then
    update public.user_access_state set trial_status='in_progress', trial_session_id=v_existing.id,
      trial_started_at=now(), trial_consumed_at=now(), updated_at=now()
      where user_id=v_user.id;
  end if;
  return jsonb_build_object('session', to_jsonb(v_existing), 'resumed', false);
end;
$$;

create or replace function public.update_my_focus_session(
  p_client_session_id text, p_status text, p_actual_seconds integer, p_paused_seconds integer
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_session public.focus_sessions;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_status not in ('running','paused','completed','ended_early','interrupted') then raise exception 'invalid_focus_status'; end if;
  update public.focus_sessions set
    status=p_status,
    actual_seconds=greatest(0,least(86400,p_actual_seconds)),
    paused_seconds=greatest(0,least(86400,p_paused_seconds)),
    ended_at=case when p_status in ('completed','ended_early','interrupted') then coalesce(ended_at,now()) else null end,
    updated_at=now()
  where user_id=auth.uid() and client_session_id=p_client_session_id
  returning * into v_session;
  if not found then raise exception 'focus_session_not_found'; end if;
  if v_session.is_trial and p_status in ('completed','ended_early','interrupted') then
    update public.user_access_state set trial_status='consumed', updated_at=now() where user_id=auth.uid();
  end if;
  return to_jsonb(v_session);
end;
$$;

create or replace function public.import_my_focus_sessions(p_sessions jsonb)
returns integer language plpgsql security definer set search_path = public as $$
declare v_item jsonb; v_count integer := 0; v_client_id text; v_status text; v_mode integer;
  v_planned integer; v_actual integer; v_seat integer;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if jsonb_typeof(p_sessions) <> 'array' or jsonb_array_length(p_sessions) > 100 then raise exception 'invalid_import'; end if;
  for v_item in select * from jsonb_array_elements(p_sessions) loop
    v_client_id := left(coalesce(v_item->>'client_session_id',v_item->>'id',''),160);
    v_status := case when v_item->>'status' in ('completed','ended_early','interrupted') then v_item->>'status' else 'interrupted' end;
    v_mode := case when coalesce(v_item->>'timer_mode','') ~ '^(0|25|50)$' then (v_item->>'timer_mode')::integer else 25 end;
    v_planned := case when coalesce(v_item->>'planned_seconds','') ~ '^\d{1,5}$' then (v_item->>'planned_seconds')::integer else v_mode*60 end;
    v_actual := case when coalesce(v_item->>'actual_seconds','') ~ '^\d{1,5}$' then (v_item->>'actual_seconds')::integer else 0 end;
    v_seat := case when coalesce(v_item->>'seat_id','') ~ '^\d{1,3}$' then (v_item->>'seat_id')::integer else null end;
    if char_length(v_client_id) >= 8 then
      insert into public.focus_sessions (
        user_id,client_session_id,scene_id,room_id,seat_id,timer_mode,planned_seconds,actual_seconds,
        started_at,ended_at,status,is_trial
      ) values (
        auth.uid(),v_client_id,left(coalesce(v_item->>'scene_id','cafe'),40),left(v_item->>'room_id',80),
        case when v_seat between 1 and 100 then v_seat else null end,v_mode,greatest(0,least(86400,v_planned)),
        greatest(0,least(86400,v_actual)),
        coalesce((v_item->>'started_at')::timestamptz,now()),coalesce((v_item->>'ended_at')::timestamptz,now()),v_status,false
      ) on conflict (user_id,client_session_id) do nothing;
      if found then v_count := v_count + 1; end if;
    end if;
  end loop;
  return v_count;
end;
$$;

create or replace function public.clear_my_focus_sessions()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  delete from public.focus_sessions where user_id=auth.uid() and status not in ('running','paused');
end;
$$;

create or replace function public.complete_account_merge(p_token_hash text)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare v_request public.account_merge_requests; v_target uuid := auth.uid(); v_source_access public.user_access_state;
begin
  if v_target is null then raise exception 'authentication_required'; end if;
  if exists(select 1 from auth.users where id=v_target and is_anonymous is true) then raise exception 'permanent_account_required'; end if;
  select * into v_request from public.account_merge_requests
    where token_hash=p_token_hash and consumed_at is null and expires_at>now() for update;
  if not found then raise exception 'merge_request_invalid'; end if;
  if v_request.anonymous_user_id=v_target then raise exception 'merge_target_invalid'; end if;

  insert into public.focus_sessions (
    user_id,client_session_id,scene_id,room_id,seat_id,timer_mode,planned_seconds,actual_seconds,paused_seconds,
    started_at,ended_at,status,is_trial,created_at,updated_at
  ) select v_target,client_session_id,scene_id,room_id,seat_id,timer_mode,planned_seconds,actual_seconds,paused_seconds,
    started_at,ended_at,status,is_trial,created_at,updated_at
    from public.focus_sessions where user_id=v_request.anonymous_user_id
  on conflict (user_id,client_session_id) do nothing;

  insert into public.user_access_state (user_id) values (v_target) on conflict (user_id) do nothing;
  select * into v_source_access from public.user_access_state where user_id=v_request.anonymous_user_id;
  if found and v_source_access.trial_status <> 'available' then
    update public.user_access_state set trial_status='consumed', trial_consumed_at=coalesce(trial_consumed_at,v_source_access.trial_consumed_at,now()), updated_at=now()
      where user_id=v_target;
  end if;
  update public.account_merge_requests set consumed_at=now() where id=v_request.id;
  return jsonb_build_object('ok',true,'anonymousUserId',v_request.anonymous_user_id,'targetUserId',v_target);
end;
$$;

revoke all on function public.get_my_access_status() from public,anon;
revoke all on function public.assert_my_product_access() from public,anon;
revoke all on function public.enforce_room_session_access() from public,anon,authenticated;
revoke all on function public.start_my_focus_session(text,text,text,integer,integer) from public,anon;
revoke all on function public.update_my_focus_session(text,text,integer,integer) from public,anon;
revoke all on function public.import_my_focus_sessions(jsonb) from public,anon;
revoke all on function public.clear_my_focus_sessions() from public,anon;
revoke all on function public.complete_account_merge(text) from public,anon;
grant execute on function public.get_my_access_status() to authenticated;
grant execute on function public.assert_my_product_access() to authenticated;
grant execute on function public.start_my_focus_session(text,text,text,integer,integer) to authenticated;
grant execute on function public.update_my_focus_session(text,text,integer,integer) to authenticated;
grant execute on function public.import_my_focus_sessions(jsonb) to authenticated;
grant execute on function public.clear_my_focus_sessions() to authenticated;
grant execute on function public.complete_account_merge(text) to authenticated;
