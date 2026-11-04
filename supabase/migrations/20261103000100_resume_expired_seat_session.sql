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

  -- Lock every enabled cafe room in a stable order. Existing reserve/switch RPCs
  -- use the same per-room lock, so recovery and normal seat selection stay atomic.
  for v_room in
    select room_id
    from public.room_instances
    where scene_id = 'cafe' and enabled
    order by room_id
  loop
    perform pg_advisory_xact_lock(hashtextextended(v_room.room_id, 0));
  end loop;

  perform public.cleanup_expired_leases();
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

  -- A permanent account may have reopened the app with a newly generated local
  -- session id. Remove its older lease first so its own seat can be reclaimed.
  delete from public.room_sessions where user_id = v_user_id;

  if exists (
    select 1 from public.room_instances
    where room_id = p_preferred_room_id and scene_id = 'cafe' and enabled
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
      where r.scene_id = 'cafe' and r.enabled
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
