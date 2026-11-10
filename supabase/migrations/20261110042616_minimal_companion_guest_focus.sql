-- Minimal companion MVP: repeat cafe focus is free for authenticated guests and accounts.
-- Retain ownership, atomic leases, single active focus, beta capacity, and all paid records.
create or replace function public.claim_my_closed_beta_slot()
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_user auth.users;
  v_settings public.closed_beta_settings;
  v_member_count integer;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into v_user from auth.users where id = auth.uid();
  if not found then raise exception 'authentication_required'; end if;

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
    'emailVerified', v_user.is_anonymous is not true,
    'accountType', case when v_user.is_anonymous then 'anonymous' else 'permanent' end,
    'trialStatus', v_access.trial_status,
    'entitlementType', case when v_is_developer then 'admin' else coalesce(v_entitlement.source_type, 'none') end,
    'subscriptionStatus', case when v_is_developer then 'developer' else v_subscription.status end,
    'canEnterProduct', true,
    'canStartFocus', true,
    'paywallReason', null
  );
end;
$$;


alter policy "permanent users read own focus sessions" on public.focus_sessions
  rename to "authenticated users read own focus sessions";
alter policy "authenticated users read own focus sessions" on public.focus_sessions
  using (auth.uid() = user_id);

create or replace function public.start_my_focus_session(
  p_client_session_id text, p_scene_id text, p_room_id text, p_seat_id integer, p_timer_mode integer
) returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_user auth.users;
  v_existing public.focus_sessions;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_client_session_id is null or char_length(p_client_session_id) not between 8 and 160
    or p_timer_mode is null or p_timer_mode not in (0,25,50)
    or p_scene_id is distinct from 'cafe'
    or coalesce(p_room_id,'') not in ('','cafe-01','cafe-02','cafe-03','cafe-local')
    or (p_seat_id is not null and p_seat_id not between 1 and 6) then
    raise exception 'invalid_focus_session';
  end if;
  select * into v_user from auth.users where id = auth.uid();
  if not found then raise exception 'authentication_required'; end if;
  perform public.claim_my_closed_beta_slot();
  -- Serialize requests from this identity before checking active sessions.
  insert into public.user_access_state(user_id) values(v_user.id) on conflict(user_id) do nothing;
  perform 1 from public.user_access_state where user_id=v_user.id for update;
  select * into v_existing from public.focus_sessions
    where user_id=v_user.id and client_session_id=p_client_session_id;
  if found then return jsonb_build_object('session',to_jsonb(v_existing),'resumed',true); end if;
  update public.focus_sessions set status='interrupted',ended_at=coalesce(ended_at,now()),updated_at=now()
    where user_id=v_user.id and status in ('running','paused')
    and started_at + make_interval(secs => case when planned_seconds>0 then planned_seconds+600 else 21600 end)<now();
  if exists(select 1 from public.focus_sessions where user_id=v_user.id and status in ('running','paused')) then
    raise exception 'active_session_exists';
  end if;
  insert into public.focus_sessions(user_id,client_session_id,scene_id,room_id,seat_id,timer_mode,planned_seconds,is_trial)
    values(v_user.id,p_client_session_id,'cafe',nullif(p_room_id,''),p_seat_id,p_timer_mode,p_timer_mode*60,false)
    returning * into v_existing;
  return jsonb_build_object('session',to_jsonb(v_existing),'resumed',false);
end;
$$;

create or replace function public.update_my_focus_session(
  p_client_session_id text,p_status text,p_actual_seconds integer,p_paused_seconds integer
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_session public.focus_sessions;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_status is null or p_status not in ('running','paused','completed','ended_early','interrupted') then
    raise exception 'invalid_focus_status';
  end if;
  select * into v_session from public.focus_sessions
    where user_id=auth.uid() and client_session_id=p_client_session_id for update;
  if not found then raise exception 'focus_session_not_found'; end if;
  -- Delayed pause/resume requests cannot reopen a finished session.
  if v_session.status not in ('running','paused') then return to_jsonb(v_session); end if;
  update public.focus_sessions set status=p_status,
    actual_seconds=greatest(actual_seconds,0,least(86400,coalesce(p_actual_seconds,0))),
    paused_seconds=greatest(paused_seconds,0,least(86400,coalesce(p_paused_seconds,0))),
    ended_at=case when p_status in ('completed','ended_early','interrupted') then coalesce(ended_at,now()) else null end,
    updated_at=now()
    where user_id=auth.uid() and client_session_id=p_client_session_id returning * into v_session;
  if v_session.is_trial and p_status in ('completed','ended_early','interrupted') then
    update public.user_access_state set trial_status='consumed',updated_at=now() where user_id=auth.uid();
  end if;
  return to_jsonb(v_session);
end;
$$;
revoke all on function public.start_my_focus_session(text,text,text,integer,integer) from public,anon;
revoke all on function public.update_my_focus_session(text,text,integer,integer) from public,anon;
grant execute on function public.start_my_focus_session(text,text,text,integer,integer) to authenticated;
grant execute on function public.update_my_focus_session(text,text,integer,integer) to authenticated;
