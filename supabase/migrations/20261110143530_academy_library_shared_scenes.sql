-- Academy Library uses the same authenticated atomic leases and one global focus session.
insert into public.room_instances(room_id,scene_id,capacity,enabled) values
('library-01','library',6,true),('library-02','library',6,true),('library-03','library',6,true)
on conflict(room_id) do nothing;

create or replace function public.allocate_room(
  p_scene_id text, p_session_id uuid, p_display_name text, p_avatar_skin integer
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user_id uuid := auth.uid(); v_room_id text; v_reconnected boolean := false;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if p_scene_id is null or p_scene_id not in ('cafe','library') then raise exception 'room_not_found'; end if;
  perform public.cleanup_expired_leases();
  perform public.upsert_my_profile(p_display_name, p_avatar_skin);
  select room_id into v_room_id from public.room_sessions
    where id = p_session_id and user_id = v_user_id and lease_expires_at > now()
    and room_id in (select room_id from public.room_instances where scene_id=p_scene_id and enabled) limit 1;
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
    return jsonb_build_object('mode', 'local', 'roomId', p_scene_id||'-local', 'reason', 'system_rooms_full');
  end if;
  return jsonb_build_object('mode', 'online', 'roomId', v_room_id, 'reconnected', v_reconnected);
end;
$$;

create or replace function public.reserve_seat(
  p_room_id text, p_seat_id integer, p_session_id uuid, p_display_name text,
  p_avatar_skin integer, p_activity text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user_id uuid := auth.uid(); v_expires timestamptz := now() + interval '15 seconds'; v_count integer;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  perform pg_advisory_xact_lock(hashtextextended('user:'||v_user_id::text,0));
  perform pg_advisory_xact_lock(hashtextextended(p_room_id, 0));
  perform public.cleanup_expired_leases();
  if p_session_id is null or p_seat_id is null or p_activity is null or char_length(trim(p_activity)) not between 1 and 40 then raise exception 'invalid_request'; end if;
  -- A delayed request from an old tab cannot displace a newer live session.
  if exists(select 1 from public.room_sessions where user_id=v_user_id and lease_expires_at>now() and (id<>p_session_id or room_id<>p_room_id)) then raise exception 'session_conflict'; end if;
  if not exists(select 1 from public.room_instances where room_id=p_room_id and enabled) or p_seat_id not between 1 and 6 then raise exception 'room_not_found'; end if;
  if exists(select 1 from public.seat_leases where room_id=p_room_id and seat_id=p_seat_id and user_id<>v_user_id) then raise exception 'seat_taken'; end if;
  perform public.upsert_my_profile(p_display_name, p_avatar_skin);
  delete from public.room_sessions where user_id=v_user_id and id<>p_session_id;
  insert into public.room_sessions (id,user_id,room_id,current_seat_id,state,activity,heartbeat_at,lease_expires_at)
    values (p_session_id,v_user_id,p_room_id,p_seat_id,'reserved',p_activity,now(),v_expires)
    on conflict (id) do update set room_id=excluded.room_id,current_seat_id=excluded.current_seat_id,state='reserved',activity=excluded.activity,heartbeat_at=now(),lease_expires_at=v_expires
    where room_sessions.user_id=v_user_id;
  get diagnostics v_count = row_count;
  if v_count=0 then raise exception 'session_expired'; end if;
  delete from public.seat_leases where user_id=v_user_id and not (room_id=p_room_id and seat_id=p_seat_id);
  insert into public.seat_leases (room_id,seat_id,session_id,user_id,display_name,avatar_skin,state,activity,transition_started_at,heartbeat_at,expires_at)
    values (p_room_id,p_seat_id,p_session_id,v_user_id,trim(p_display_name),p_avatar_skin,'reserved',p_activity,now(),now(),v_expires)
    on conflict (room_id,seat_id) do update set session_id=excluded.session_id,user_id=excluded.user_id,display_name=excluded.display_name,avatar_skin=excluded.avatar_skin,state='reserved',activity=excluded.activity,transition_started_at=now(),heartbeat_at=now(),expires_at=v_expires,from_seat_id=null
    where seat_leases.user_id=v_user_id;
  get diagnostics v_count = row_count;
  if v_count=0 then raise exception 'seat_taken'; end if;
  return jsonb_build_object('ok',true,'roomId',p_room_id,'seatId',p_seat_id,'sessionId',p_session_id,'state','reserved','expiresAt',extract(epoch from v_expires)*1000);
end;
$$;

create or replace function public.resume_seat_session(
  p_session_id uuid,
  p_preferred_room_id text,
  p_preferred_seat_id integer,
  p_display_name text,
  p_avatar_skin integer,
  p_activity text,
  p_focusing boolean,
  p_focus_started_at timestamptz default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user_id uuid := auth.uid();
  v_scene_id text;
  v_room record;
  v_existing public.seat_leases;
  v_room_id text;
  v_seat_id integer;
  v_expires timestamptz := now() + interval '45 seconds';
  v_focus_started_at timestamptz;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if p_session_id is null
    or char_length(trim(p_display_name)) not between 1 and 24
    or p_avatar_skin not between 0 and 3
    or char_length(trim(p_activity)) not between 1 and 40
    or p_preferred_seat_id not between 1 and 6 then
    raise exception 'invalid_request';
  end if;

  select scene_id into v_scene_id from public.room_instances where room_id=p_preferred_room_id and enabled and scene_id in ('cafe','library');
  if v_scene_id is null then raise exception 'room_not_found'; end if;
  perform pg_advisory_xact_lock(hashtextextended('user:'||v_user_id::text,0));
  -- Lock every enabled target-scene room in a stable order. Existing reserve/switch RPCs
  -- use the same per-room lock, so recovery and normal seat selection stay atomic.
  for v_room in
    select room_id
    from public.room_instances
    where scene_id = v_scene_id and enabled
    order by room_id
  loop
    perform pg_advisory_xact_lock(hashtextextended(v_room.room_id, 0));
  end loop;

  perform public.cleanup_expired_leases();
  if exists(select 1 from public.room_sessions where user_id=v_user_id and lease_expires_at>now() and (id<>p_session_id or room_id not in (select room_id from public.room_instances where scene_id=v_scene_id))) then raise exception 'session_conflict'; end if;
  perform public.upsert_my_profile(p_display_name, p_avatar_skin);

  select * into v_existing
  from public.seat_leases
  where session_id = p_session_id
    and user_id = v_user_id
    and expires_at > now()
  for update;

  if found then
    v_focus_started_at := case
      when p_focusing then least(coalesce(v_existing.focus_started_at, p_focus_started_at, now()), now())
      else coalesce(v_existing.focus_started_at, p_focus_started_at)
    end;
    update public.seat_leases
    set state = 'occupied', activity = trim(p_activity), heartbeat_at = now(),
        expires_at = v_expires, focus_started_at = v_focus_started_at,
        from_seat_id = null
    where session_id = p_session_id and user_id = v_user_id;
    update public.room_sessions
    set room_id = v_existing.room_id, current_seat_id = v_existing.seat_id,
        state = 'occupied', activity = trim(p_activity), heartbeat_at = now(),
        lease_expires_at = v_expires, focus_started_at = v_focus_started_at
    where id = p_session_id and user_id = v_user_id;
    return jsonb_build_object(
      'ok', true, 'recovered', true, 'moved', false,
      'roomId', v_existing.room_id, 'seatId', v_existing.seat_id,
      'sessionId', p_session_id, 'state', 'occupied',
      'expiresAt', extract(epoch from v_expires) * 1000
    );
  end if;

  -- Only expired ownership may be replaced; fresh sessions were protected above.
  delete from public.room_sessions where user_id = v_user_id;

  if exists (
    select 1 from public.room_instances
    where room_id = p_preferred_room_id and scene_id = v_scene_id and enabled
  ) and not exists (
    select 1 from public.seat_leases
    where room_id = p_preferred_room_id and seat_id = p_preferred_seat_id
  ) then
    v_room_id := p_preferred_room_id;
    v_seat_id := p_preferred_seat_id;
  else
    select candidate.room_id, candidate.seat_id
    into v_room_id, v_seat_id
    from (
      select r.room_id, seats.seat_id,
        (select count(*) from public.seat_leases occupied where occupied.room_id = r.room_id) as occupied_count
      from public.room_instances r
      cross join lateral generate_series(1, least(r.capacity::integer, 6)) as seats(seat_id)
      where r.scene_id = v_scene_id and r.enabled
        and not exists (
          select 1 from public.seat_leases taken
          where taken.room_id = r.room_id and taken.seat_id = seats.seat_id
        )
    ) candidate
    order by
      (candidate.room_id = p_preferred_room_id) desc,
      candidate.occupied_count desc,
      candidate.room_id asc,
      candidate.seat_id asc
    limit 1;
  end if;

  if v_room_id is null or v_seat_id is null then
    return jsonb_build_object('ok', false, 'error', 'system_rooms_full');
  end if;

  v_focus_started_at := case
    when p_focusing then least(coalesce(p_focus_started_at, now()), now())
    else p_focus_started_at
  end;
  insert into public.room_sessions (
    id, user_id, room_id, current_seat_id, state, activity,
    focus_started_at, heartbeat_at, lease_expires_at
  ) values (
    p_session_id, v_user_id, v_room_id, v_seat_id, 'occupied', trim(p_activity),
    v_focus_started_at, now(), v_expires
  );
  insert into public.seat_leases (
    room_id, seat_id, session_id, user_id, display_name, avatar_skin,
    state, activity, transition_started_at, focus_started_at, heartbeat_at,
    expires_at, from_seat_id
  ) values (
    v_room_id, v_seat_id, p_session_id, v_user_id, trim(p_display_name), p_avatar_skin,
    'occupied', trim(p_activity), now(), v_focus_started_at, now(),
    v_expires, null
  );

  return jsonb_build_object(
    'ok', true, 'recovered', true,
    'moved', v_room_id <> p_preferred_room_id or v_seat_id <> p_preferred_seat_id,
    'roomId', v_room_id, 'seatId', v_seat_id,
    'sessionId', p_session_id, 'state', 'occupied',
    'expiresAt', extract(epoch from v_expires) * 1000
  );
end;
$$;

revoke all on function public.resume_seat_session(uuid,text,integer,text,integer,text,boolean,timestamptz) from public,anon;
grant execute on function public.resume_seat_session(uuid,text,integer,text,integer,text,boolean,timestamptz) to authenticated;


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
    or (p_scene_id is null or p_scene_id not in ('cafe','library'))
    or (coalesce(p_room_id,'') not in ('',p_scene_id||'-local') and not exists(select 1 from public.room_instances where room_id=p_room_id and scene_id=p_scene_id and enabled))
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
  if found then
    if v_existing.scene_id is distinct from p_scene_id or coalesce(v_existing.room_id,'') is distinct from coalesce(p_room_id,'') or v_existing.seat_id is distinct from p_seat_id or v_existing.timer_mode is distinct from p_timer_mode then raise exception 'session_conflict'; end if;
    return jsonb_build_object('session',to_jsonb(v_existing),'resumed',true);
  end if;
  update public.focus_sessions set status='interrupted',ended_at=coalesce(ended_at,now()),updated_at=now()
    where user_id=v_user.id and status in ('running','paused')
    and started_at + make_interval(secs => case when planned_seconds>0 then planned_seconds+600 else 21600 end)<now();
  if exists(select 1 from public.focus_sessions where user_id=v_user.id and status in ('running','paused')) then
    raise exception 'active_session_exists';
  end if;
  if coalesce(p_room_id,'') not in ('',p_scene_id||'-local') and not exists(select 1 from public.seat_leases where user_id=v_user.id and room_id=p_room_id and seat_id=p_seat_id and state='occupied' and expires_at>now()) then raise exception 'seat_session_required'; end if;
  insert into public.focus_sessions(user_id,client_session_id,scene_id,room_id,seat_id,timer_mode,planned_seconds,is_trial)
    values(v_user.id,p_client_session_id,p_scene_id,nullif(p_room_id,''),p_seat_id,p_timer_mode,p_timer_mode*60,false)
    returning * into v_existing;
  return jsonb_build_object('session',to_jsonb(v_existing),'resumed',false);
end;
$$;

revoke all on function public.allocate_room(text,uuid,text,integer), public.reserve_seat(text,integer,uuid,text,integer,text), public.start_my_focus_session(text,text,text,integer,integer) from public,anon;
grant execute on function public.allocate_room(text,uuid,text,integer), public.reserve_seat(text,integer,uuid,text,integer,text), public.start_my_focus_session(text,text,text,integer,integer) to authenticated;
