-- User-owned profile RPCs. Clients never receive direct profile-table access.
alter table public.profiles add column avatar_url text;
alter table public.profiles add column avatar_source text not null default 'builtin'
  check (avatar_source in ('builtin','upload','google','github'));
alter table public.seat_leases add column avatar_url text;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('profile-avatars','profile-avatars',true,262144,array['image/webp'])
on conflict(id) do nothing;
-- No INSERT/UPDATE policy: the verified server upload route decodes, crops and
-- strips metadata before using the service role to store an immutable WebP.

create or replace function public.get_my_profile()
returns jsonb language sql stable security definer set search_path = public as $$
  select to_jsonb(p) - 'user_id' from public.profiles p where p.user_id=auth.uid();
$$;

create or replace function public.set_my_profile(
  p_display_name text, p_avatar_skin integer, p_avatar_url text default null, p_avatar_source text default 'builtin'
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_profile public.profiles; v_path text;
begin
  if v_uid is null then raise exception 'authentication_required'; end if;
  if p_display_name is null or char_length(trim(p_display_name)) not between 1 and 24
    or p_avatar_skin is null or p_avatar_skin not between 0 and 3
    or p_avatar_source is null or p_avatar_source not in ('builtin','upload','google','github') then raise exception 'invalid_profile'; end if;
  if p_avatar_source='builtin' then
    p_avatar_url := null;
  elsif p_avatar_url is null or char_length(p_avatar_url)>2048 then raise exception 'invalid_avatar';
  elsif p_avatar_source='google' and p_avatar_url !~ '^https://[a-zA-Z0-9.-]+\.googleusercontent\.com/' then raise exception 'invalid_avatar';
  elsif p_avatar_source='github' and p_avatar_url !~ '^https://avatars\.githubusercontent\.com/' then raise exception 'invalid_avatar';
  elsif p_avatar_source='upload' then
    v_path := substring(p_avatar_url from '/storage/v1/object/public/profile-avatars/(.*)$');
    if p_avatar_url !~ '^https://[a-z0-9]+\.supabase\.co/storage/v1/object/public/profile-avatars/'
      or v_path is null or v_path !~ ('^'||v_uid::text||'/[a-f0-9-]{36}\.webp$')
      or not exists(select 1 from storage.objects where bucket_id='profile-avatars' and name=v_path)
      then raise exception 'invalid_avatar'; end if;
  end if;
  insert into public.profiles(user_id,display_name,avatar_skin,avatar_url,avatar_source)
    values(v_uid,trim(p_display_name),p_avatar_skin,p_avatar_url,p_avatar_source)
    on conflict(user_id) do update set display_name=excluded.display_name,avatar_skin=excluded.avatar_skin,
      avatar_url=excluded.avatar_url,avatar_source=excluded.avatar_source,updated_at=now()
    returning * into v_profile;
  update public.seat_leases set display_name=v_profile.display_name,avatar_skin=v_profile.avatar_skin,avatar_url=v_profile.avatar_url where user_id=v_uid;
  return to_jsonb(v_profile)-'user_id';
end;
$$;

-- Heartbeats/reservations from another tab must not overwrite edited profiles.
create or replace function public.upsert_my_profile(p_display_name text, p_avatar_skin integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  if p_display_name is null or char_length(trim(p_display_name)) not between 1 and 24 or p_avatar_skin is null or p_avatar_skin not between 0 and 3 then raise exception 'invalid_profile'; end if;
  insert into public.profiles(user_id,display_name,avatar_skin) values(auth.uid(),trim(p_display_name),p_avatar_skin) on conflict(user_id) do nothing;
end;
$$;

create or replace function public.get_room_state(p_room_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_result jsonb;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  perform public.cleanup_expired_leases();
  if not exists(select 1 from public.room_instances where room_id=p_room_id and enabled) then raise exception 'room_not_found'; end if;
  select coalesce(jsonb_agg(to_jsonb(l)||jsonb_build_object('display_name',coalesce(p.display_name,l.display_name),'avatar_skin',coalesce(p.avatar_skin,l.avatar_skin),'avatar_url',p.avatar_url) order by l.seat_id),'[]'::jsonb)
  into v_result from public.seat_leases l left join public.profiles p on p.user_id=l.user_id where l.room_id=p_room_id and l.expires_at>now();
  return jsonb_build_object('server_now',now(),'leases',v_result);
end;
$$;

create or replace function public.broadcast_seat_lease_change()
returns trigger language plpgsql security definer set search_path = public,realtime as $$
declare v_row public.seat_leases; v_visible_changed boolean;
begin
  v_row := coalesce(new,old);
  v_visible_changed := tg_op <> 'UPDATE' or
    (new.room_id,new.seat_id,new.session_id,new.user_id,new.display_name,new.avatar_skin,new.avatar_url,new.state,new.activity,new.focus_started_at,new.from_seat_id)
    is distinct from
    (old.room_id,old.seat_id,old.session_id,old.user_id,old.display_name,old.avatar_skin,old.avatar_url,old.state,old.activity,old.focus_started_at,old.from_seat_id);
  if v_visible_changed then
    perform realtime.broadcast_changes('room:'||v_row.room_id||':leases','room_changed',tg_op,tg_table_name,tg_table_schema,new,old);
  end if;
  return coalesce(new,old);
end;
$$;
revoke all on function public.get_my_profile() from public,anon;
revoke all on function public.set_my_profile(text,integer,text,text) from public,anon;
grant execute on function public.get_my_profile() to authenticated;
grant execute on function public.set_my_profile(text,integer,text,text) to authenticated;
