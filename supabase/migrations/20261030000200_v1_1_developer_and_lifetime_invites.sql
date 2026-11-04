-- Focus Isle v1.1: developer authorization and atomic limited lifetime invitations.

create table if not exists public.lifetime_invite_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 80),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  max_claims integer not null check (max_claims between 1 and 100000),
  claimed_count integer not null default 0 check (claimed_count >= 0 and claimed_count <= max_claims),
  active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);

create table if not exists public.lifetime_invite_claims (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.lifetime_invite_campaigns(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  unique (campaign_id, user_id),
  unique (user_id)
);

create index if not exists lifetime_invite_claims_campaign_id_idx
  on public.lifetime_invite_claims(campaign_id);

alter table public.lifetime_invite_campaigns enable row level security;
alter table public.lifetime_invite_claims enable row level security;
revoke all on public.lifetime_invite_campaigns, public.lifetime_invite_claims from anon, authenticated;

create or replace function public.claim_my_lifetime_invite(p_token_hash text)
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_user auth.users;
  v_campaign public.lifetime_invite_campaigns;
  v_existing public.lifetime_invite_claims;
  v_inserted integer := 0;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_token_hash !~ '^[a-f0-9]{64}$' then raise exception 'invalid_invitation'; end if;
  select * into v_user from auth.users where id = auth.uid();
  if not found or v_user.is_anonymous is true then raise exception 'registration_required'; end if;
  if v_user.email_confirmed_at is null then raise exception 'email_verification_required'; end if;

  select * into v_existing from public.lifetime_invite_claims where user_id = v_user.id;
  if found then
    return jsonb_build_object('claimed', true, 'alreadyClaimed', true, 'campaignId', v_existing.campaign_id);
  end if;

  select * into v_campaign from public.lifetime_invite_campaigns
    where token_hash = p_token_hash and active and starts_at <= now()
      and (ends_at is null or ends_at > now())
    for update;
  if not found then raise exception 'invalid_invitation'; end if;
  if v_campaign.claimed_count >= v_campaign.max_claims then raise exception 'invitation_exhausted'; end if;

  insert into public.lifetime_invite_claims (campaign_id, user_id)
    values (v_campaign.id, v_user.id)
    on conflict (user_id) do nothing;
  get diagnostics v_inserted = row_count;
  if v_inserted <> 1 then
    return jsonb_build_object('claimed', true, 'alreadyClaimed', true, 'campaignId', v_campaign.id);
  end if;

  update public.lifetime_invite_campaigns
    set claimed_count = claimed_count + 1, updated_at = now()
    where id = v_campaign.id;
  insert into public.entitlements (
    user_id, entitlement_key, source_type, source_id, active, expires_at, updated_at
  ) values (
    v_user.id, 'focus_core_access', 'lifetime', v_campaign.id::text, true, null, now()
  ) on conflict (user_id, entitlement_key, source_type, source_id)
    do update set active = true, expires_at = null, updated_at = now();

  return jsonb_build_object(
    'claimed', true,
    'alreadyClaimed', false,
    'campaignId', v_campaign.id,
    'remaining', greatest(v_campaign.max_claims - v_campaign.claimed_count - 1, 0)
  );
end;
$$;

create or replace function public.get_my_access_status()
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_user auth.users;
  v_access public.user_access_state;
  v_entitlement public.entitlements;
  v_subscription public.subscriptions;
  v_is_developer boolean := false;
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

  v_is_developer := coalesce(v_user.raw_app_meta_data->>'role', '') = 'developer';
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
    'entitlementType', case when v_is_developer then 'admin' else coalesce(v_entitlement.source_type, 'none') end,
    'subscriptionStatus', case when v_is_developer then 'developer' else v_subscription.status end,
    'canEnterProduct', true,
    'canStartFocus', v_is_developer or v_entitlement.id is not null or v_access.trial_status in ('available', 'in_progress'),
    'paywallReason', case when not v_is_developer and v_entitlement.id is null and v_access.trial_status = 'consumed' then 'payment_required' else null end
  );
end;
$$;

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
  select coalesce(v_user.raw_app_meta_data->>'role', '') = 'developer' or exists(
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
    update public.user_access_state set
      trial_status = 'in_progress', trial_session_id = v_existing.id,
      trial_started_at = now(), trial_consumed_at = now(), updated_at = now()
      where user_id = v_user.id;
  end if;
  return jsonb_build_object('session', to_jsonb(v_existing), 'resumed', false);
end;
$$;

revoke all on function public.claim_my_lifetime_invite(text) from public, anon;
grant execute on function public.claim_my_lifetime_invite(text) to authenticated;
revoke all on function public.get_my_access_status() from public, anon;
grant execute on function public.get_my_access_status() to authenticated;
revoke all on function public.start_my_focus_session(text,text,text,integer,integer) from public, anon;
grant execute on function public.start_my_focus_session(text,text,text,integer,integer) to authenticated;
