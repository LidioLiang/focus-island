-- Recover focus sessions that outlived their planned duration because the
-- browser was closed, suspended, or lost before it could send the final PATCH.
-- Timed sessions get a ten-minute grace period; free-focus sessions get six
-- hours because they have no planned end time.

update public.user_access_state as access
set trial_status = 'consumed', updated_at = now()
where access.trial_status = 'in_progress'
  and exists (
    select 1
    from public.focus_sessions as session
    where session.id = access.trial_session_id
      and session.user_id = access.user_id
      and session.status in ('running', 'paused')
      and session.started_at + make_interval(secs => case
        when session.planned_seconds > 0 then session.planned_seconds + 600
        else 21600
      end) < now()
  );

update public.focus_sessions as session
set status = 'interrupted', ended_at = coalesce(session.ended_at, now()), updated_at = now()
where session.status in ('running', 'paused')
  and session.started_at + make_interval(secs => case
    when session.planned_seconds > 0 then session.planned_seconds + 600
    else 21600
  end) < now();

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

  -- Reconcile only sessions safely beyond their intended lifetime. A fresh
  -- session on another device still keeps the single-active-session guard.
  update public.user_access_state as access
  set trial_status = 'consumed', updated_at = now()
  where access.user_id = v_user.id
    and access.trial_status = 'in_progress'
    and exists (
      select 1
      from public.focus_sessions as session
      where session.id = access.trial_session_id
        and session.user_id = v_user.id
        and session.status in ('running', 'paused')
        and session.started_at + make_interval(secs => case
          when session.planned_seconds > 0 then session.planned_seconds + 600
          else 21600
        end) < now()
    );

  update public.focus_sessions as session
  set status = 'interrupted', ended_at = coalesce(session.ended_at, now()), updated_at = now()
  where session.user_id = v_user.id
    and session.status in ('running', 'paused')
    and session.started_at + make_interval(secs => case
      when session.planned_seconds > 0 then session.planned_seconds + 600
      else 21600
    end) < now();

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

revoke all on function public.start_my_focus_session(text,text,text,integer,integer) from public, anon;
grant execute on function public.start_my_focus_session(text,text,text,integer,integer) to authenticated;
