-- Focus Isle v1.1: remove unnecessary public execution and close anonymous history access.

revoke all on function public.rls_auto_enable() from public, anon, authenticated;
revoke all on function public.assert_my_product_access() from authenticated;

drop policy if exists "users read own focus sessions" on public.focus_sessions;
create policy "verified permanent users read own focus sessions"
  on public.focus_sessions for select to authenticated
  using (
    (select auth.uid()) = user_id
    and coalesce(((select auth.jwt())->>'is_anonymous')::boolean, false) is false
  );

create index if not exists account_merge_requests_anonymous_user_idx
  on public.account_merge_requests(anonymous_user_id);
create index if not exists room_sessions_room_id_idx
  on public.room_sessions(room_id);

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
  if v_user.email_confirmed_at is null then raise exception 'email_verification_required'; end if;
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
  if v_user.email_confirmed_at is null then raise exception 'email_verification_required'; end if;
  delete from public.focus_sessions where user_id=auth.uid() and status not in ('running','paused');
end;
$$;

revoke all on function public.import_my_focus_sessions(jsonb) from public, anon;
revoke all on function public.clear_my_focus_sessions() from public, anon;
grant execute on function public.import_my_focus_sessions(jsonb) to authenticated;
grant execute on function public.clear_my_focus_sessions() to authenticated;
