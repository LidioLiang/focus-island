-- Static rooms have no walking phase: reserve and occupy in one transaction.
-- Reuse the existing ownership checks, user/room locks and lease lifecycle.
create or replace function public.reserve_and_occupy_seat(
  p_room_id text, p_seat_id integer, p_session_id uuid, p_display_name text,
  p_avatar_skin integer, p_activity text
) returns jsonb language plpgsql security invoker set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  perform public.reserve_seat(p_room_id, p_seat_id, p_session_id, p_display_name, p_avatar_skin, p_activity);
  return public.occupy_seat(p_session_id, p_room_id, p_seat_id);
end;
$$;
revoke all on function public.reserve_and_occupy_seat(text, integer, uuid, text, integer, text) from public, anon;
grant execute on function public.reserve_and_occupy_seat(text, integer, uuid, text, integer, text) to authenticated;
