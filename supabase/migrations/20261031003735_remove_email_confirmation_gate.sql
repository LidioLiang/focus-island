-- Focus Isle v1.1: permanent email/password accounts become usable immediately.
-- Email ownership confirmation is disabled in Supabase Auth; authorization still
-- requires a non-anonymous authenticated user and keeps all existing RLS/RPC gates.

alter policy "verified permanent users read own focus sessions"
  on public.focus_sessions
  rename to "permanent users read own focus sessions";

create or replace function public.claim_my_closed_beta_slot()
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_user auth.users;
  v_settings public.closed_beta_settings;
  v_member_count integer;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into v_user from auth.users where id = auth.uid();
  if not found or v_user.is_anonymous is true then raise exception 'registration_required'; end if;

  if coalesce(v_user.raw_app_meta_data->>'role', '') = 'developer' then
    return jsonb_build_object('enabled', true, 'admitted', true, 'developer', true);
  end if;

  select * into v_settings from public.closed_beta_settings where id is true for update;
  if not found or v_settings.enabled is false then
    return jsonb_build_object('enabled', false, 'admitted', true);
  end if;

  if exists(select 1 from public.closed_beta_members where user_id = auth.uid()) then
    select count(*) into v_member_count from public.closed_beta_members;
    return jsonb_build_object(
      'enabled', true, 'admitted', true,
      'memberCount', v_member_count, 'maxMembers', v_settings.max_members
    );
  end if;

  select count(*) into v_member_count from public.closed_beta_members;
  if v_member_count >= v_settings.max_members then raise exception 'closed_beta_full'; end if;

  insert into public.closed_beta_members (user_id) values (auth.uid());
  return jsonb_build_object(
    'enabled', true, 'admitted', true,
    'memberCount', v_member_count + 1, 'maxMembers', v_settings.max_members
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

  perform public.claim_my_closed_beta_slot();
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

create or replace function public.import_my_focus_sessions(p_sessions jsonb)
returns integer language plpgsql security definer set search_path = public, auth as $$
declare
  v_user auth.users;
  v_item jsonb;
  v_count integer := 0;
  v_client_id text;
  v_status text;
  v_mode integer;
  v_planned integer;
  v_actual integer;
  v_seat integer;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into v_user from auth.users where id = auth.uid();
  if not found or v_user.is_anonymous is true then raise exception 'registration_required'; end if;
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
returns void language plpgsql security definer set search_path = public, auth as $$
declare v_user auth.users;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into v_user from auth.users where id = auth.uid();
  if not found or v_user.is_anonymous is true then raise exception 'registration_required'; end if;
  delete from public.focus_sessions where user_id=auth.uid() and status not in ('running','paused');
end;
$$;
