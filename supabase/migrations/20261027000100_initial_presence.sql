create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 24),
  avatar_skin smallint not null check (avatar_skin between 0 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.room_instances (
  room_id text primary key,
  scene_id text not null,
  capacity smallint not null default 6 check (capacity between 1 and 100),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.room_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  room_id text not null references public.room_instances(room_id),
  current_seat_id smallint check (current_seat_id between 1 and 6),
  state text not null check (state in ('reserved', 'moving', 'occupied')),
  activity text not null default '安静专注' check (char_length(activity) between 1 and 40),
  entered_at timestamptz not null default now(),
  focus_started_at timestamptz,
  heartbeat_at timestamptz not null default now(),
  lease_expires_at timestamptz not null,
  unique (user_id)
);

create table public.seat_leases (
  room_id text not null references public.room_instances(room_id),
  seat_id smallint not null check (seat_id between 1 and 6),
  session_id uuid not null references public.room_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 24),
  avatar_skin smallint not null check (avatar_skin between 0 and 3),
  state text not null check (state in ('reserved', 'moving', 'occupied')),
  activity text not null default '安静专注' check (char_length(activity) between 1 and 40),
  transition_started_at timestamptz not null default now(),
  focus_started_at timestamptz,
  heartbeat_at timestamptz not null default now(),
  expires_at timestamptz not null,
  from_seat_id smallint check (from_seat_id between 1 and 6),
  primary key (room_id, seat_id),
  unique (session_id),
  unique (user_id)
);

create index room_sessions_expiry_idx on public.room_sessions (lease_expires_at);
create index seat_leases_room_expiry_idx on public.seat_leases (room_id, expires_at);

insert into public.room_instances (room_id, scene_id, capacity) values
  ('cafe-01', 'cafe', 6), ('cafe-02', 'cafe', 6), ('cafe-03', 'cafe', 6);

alter table public.profiles enable row level security;
alter table public.room_instances enable row level security;
alter table public.room_sessions enable row level security;
alter table public.seat_leases enable row level security;

revoke all on public.profiles, public.room_instances, public.room_sessions, public.seat_leases from anon, authenticated;

create or replace function public.cleanup_expired_leases()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.seat_leases where expires_at <= now();
  delete from public.room_sessions where lease_expires_at <= now();
end;
$$;

create or replace function public.upsert_my_profile(p_display_name text, p_avatar_skin integer)
returns void language plpgsql security definer set search_path = public as $$
declare v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  if char_length(trim(p_display_name)) not between 1 and 24 or p_avatar_skin not between 0 and 3 then
    raise exception 'invalid_profile';
  end if;
  insert into public.profiles (user_id, display_name, avatar_skin)
  values (v_user_id, trim(p_display_name), p_avatar_skin)
  on conflict (user_id) do update set display_name = excluded.display_name, avatar_skin = excluded.avatar_skin, updated_at = now();
end;
$$;

create or replace function public.allocate_room(
  p_scene_id text, p_session_id uuid, p_display_name text, p_avatar_skin integer
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user_id uuid := auth.uid(); v_room_id text; v_reconnected boolean := false;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
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

create or replace function public.reserve_seat(
  p_room_id text, p_seat_id integer, p_session_id uuid, p_display_name text,
  p_avatar_skin integer, p_activity text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user_id uuid := auth.uid(); v_expires timestamptz := now() + interval '15 seconds'; v_count integer;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_room_id, 0));
  perform public.cleanup_expired_leases();
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

create or replace function public.occupy_seat(p_session_id uuid, p_room_id text, p_seat_id integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user_id uuid := auth.uid(); v_expires timestamptz := now()+interval '45 seconds'; v_focus timestamptz;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_room_id, 0));
  select focus_started_at into v_focus from public.seat_leases where room_id=p_room_id and seat_id=p_seat_id and session_id=p_session_id and user_id=v_user_id and expires_at>now() for update;
  if not found then raise exception 'reservation_expired'; end if;
  update public.seat_leases set state='occupied',heartbeat_at=now(),expires_at=v_expires,from_seat_id=null where session_id=p_session_id and user_id=v_user_id;
  update public.room_sessions set current_seat_id=p_seat_id,state='occupied',heartbeat_at=now(),lease_expires_at=v_expires where id=p_session_id and user_id=v_user_id;
  return jsonb_build_object('ok',true,'state','occupied','roomId',p_room_id,'seatId',p_seat_id,'focusStartedAt',case when v_focus is null then null else extract(epoch from v_focus)*1000 end,'expiresAt',extract(epoch from v_expires)*1000);
end;
$$;

create or replace function public.switch_seat(
  p_session_id uuid,p_room_id text,p_from_seat_id integer,p_new_seat_id integer,
  p_display_name text,p_avatar_skin integer,p_activity text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user_id uuid:=auth.uid(); v_expires timestamptz:=now()+interval '15 seconds'; v_focus timestamptz;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_room_id,0));
  perform public.cleanup_expired_leases();
  select focus_started_at into v_focus from public.seat_leases where room_id=p_room_id and seat_id=p_from_seat_id and session_id=p_session_id and user_id=v_user_id for update;
  if not found then raise exception 'session_expired'; end if;
  if exists(select 1 from public.seat_leases where room_id=p_room_id and seat_id=p_new_seat_id and user_id<>v_user_id) then raise exception 'seat_taken'; end if;
  delete from public.seat_leases where session_id=p_session_id and user_id=v_user_id;
  insert into public.seat_leases (room_id,seat_id,session_id,user_id,display_name,avatar_skin,state,activity,transition_started_at,focus_started_at,heartbeat_at,expires_at,from_seat_id)
    values (p_room_id,p_new_seat_id,p_session_id,v_user_id,trim(p_display_name),p_avatar_skin,'moving',p_activity,now(),v_focus,now(),v_expires,p_from_seat_id);
  update public.room_sessions set current_seat_id=p_new_seat_id,state='moving',heartbeat_at=now(),lease_expires_at=v_expires where id=p_session_id and user_id=v_user_id;
  return jsonb_build_object('ok',true,'state','moving','roomId',p_room_id,'fromSeatId',p_from_seat_id,'seatId',p_new_seat_id,'expiresAt',extract(epoch from v_expires)*1000);
end;
$$;

create or replace function public.heartbeat_session(p_session_id uuid,p_activity text,p_focusing boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user_id uuid:=auth.uid(); v_lease public.seat_leases; v_expires timestamptz;
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  select * into v_lease from public.seat_leases where session_id=p_session_id and user_id=v_user_id and expires_at>now() for update;
  if not found then raise exception 'session_expired'; end if;
  v_expires := now() + case when v_lease.state='reserved' then interval '15 seconds' else interval '45 seconds' end;
  update public.seat_leases set heartbeat_at=now(),expires_at=v_expires,activity=p_activity,focus_started_at=case when p_focusing then coalesce(focus_started_at,now()) else focus_started_at end where session_id=p_session_id and user_id=v_user_id returning * into v_lease;
  update public.room_sessions set heartbeat_at=now(),lease_expires_at=v_expires,activity=p_activity,focus_started_at=case when p_focusing then coalesce(focus_started_at,now()) else focus_started_at end where id=p_session_id and user_id=v_user_id;
  return jsonb_build_object('lease',to_jsonb(v_lease),'server_now',now());
end;
$$;

create or replace function public.release_session(p_session_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_user_id uuid:=auth.uid();
begin
  if v_user_id is null then raise exception 'authentication_required'; end if;
  delete from public.room_sessions where id=p_session_id and user_id=v_user_id;
  return jsonb_build_object('ok',true);
end;
$$;

create or replace function public.get_room_state(p_room_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_result jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  perform public.cleanup_expired_leases();
  if not exists(select 1 from public.room_instances where room_id=p_room_id and enabled) then raise exception 'room_not_found'; end if;
  select coalesce(jsonb_agg(to_jsonb(l) order by l.seat_id),'[]'::jsonb) into v_result from public.seat_leases l where l.room_id=p_room_id and l.expires_at>now();
  return jsonb_build_object('server_now',now(),'leases',v_result);
end;
$$;

create or replace function public.broadcast_seat_lease_change()
returns trigger language plpgsql security definer set search_path = public,realtime as $$
declare v_row public.seat_leases; v_visible_changed boolean;
begin
  v_row := coalesce(new,old);
  v_visible_changed := tg_op <> 'UPDATE' or
    (new.room_id,new.seat_id,new.session_id,new.user_id,new.display_name,new.avatar_skin,new.state,new.activity,new.focus_started_at,new.from_seat_id)
    is distinct from
    (old.room_id,old.seat_id,old.session_id,old.user_id,old.display_name,old.avatar_skin,old.state,old.activity,old.focus_started_at,old.from_seat_id);
  if v_visible_changed then
    perform realtime.broadcast_changes('room:'||v_row.room_id||':leases','room_changed',tg_op,tg_table_name,tg_table_schema,new,old);
  end if;
  return coalesce(new,old);
end;
$$;

create trigger seat_lease_realtime after insert or update or delete on public.seat_leases
for each row execute function public.broadcast_seat_lease_change();

create policy "authenticated room broadcasts" on realtime.messages for select to authenticated
using (realtime.topic() like 'room:%:leases');

create or replace function public.cleanup_stale_anonymous_users(p_before timestamptz)
returns integer language plpgsql security definer set search_path = public as $$
declare v_deleted integer;
begin
  with deleted as (
    delete from auth.users u
    where u.is_anonymous is true
      and coalesce(u.last_sign_in_at, u.created_at) < p_before
      and not exists (
        select 1 from public.room_sessions s
        where s.user_id = u.id and s.lease_expires_at > now()
      )
    returning u.id
  )
  select count(*)::integer into v_deleted from deleted;
  return v_deleted;
end;
$$;

revoke all on function public.cleanup_expired_leases() from public,anon,authenticated;
revoke all on function public.cleanup_stale_anonymous_users(timestamptz) from public,anon,authenticated;
revoke all on function public.upsert_my_profile(text,integer) from public,anon;
revoke all on function public.allocate_room(text,uuid,text,integer) from public,anon;
revoke all on function public.reserve_seat(text,integer,uuid,text,integer,text) from public,anon;
revoke all on function public.occupy_seat(uuid,text,integer) from public,anon;
revoke all on function public.switch_seat(uuid,text,integer,integer,text,integer,text) from public,anon;
revoke all on function public.heartbeat_session(uuid,text,boolean) from public,anon;
revoke all on function public.release_session(uuid) from public,anon;
revoke all on function public.get_room_state(text) from public,anon;
revoke all on function public.broadcast_seat_lease_change() from public,anon,authenticated;
grant execute on function public.upsert_my_profile(text,integer) to authenticated;
grant execute on function public.allocate_room(text,uuid,text,integer) to authenticated;
grant execute on function public.reserve_seat(text,integer,uuid,text,integer,text) to authenticated;
grant execute on function public.occupy_seat(uuid,text,integer) to authenticated;
grant execute on function public.switch_seat(uuid,text,integer,integer,text,integer,text) to authenticated;
grant execute on function public.heartbeat_session(uuid,text,boolean) to authenticated;
grant execute on function public.release_session(uuid) to authenticated;
grant execute on function public.get_room_state(text) to authenticated;
grant execute on function public.cleanup_stale_anonymous_users(timestamptz) to service_role;
