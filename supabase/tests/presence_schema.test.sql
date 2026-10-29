begin;
create extension if not exists pgtap with schema extensions;
select plan(17);

select has_table('public', 'profiles', 'profiles exists');
select has_table('public', 'room_instances', 'room_instances exists');
select has_table('public', 'room_sessions', 'room_sessions exists');
select has_table('public', 'seat_leases', 'seat_leases exists');
select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.room_instances'::regclass), 'room_instances has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.room_sessions'::regclass), 'room_sessions has RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.seat_leases'::regclass), 'seat_leases has RLS enabled');
select has_function('public', 'allocate_room', array['text','uuid','text','integer']);
select has_function('public', 'reserve_seat', array['text','integer','uuid','text','integer','text']);
select has_function('public', 'occupy_seat', array['uuid','text','integer']);
select has_function('public', 'switch_seat', array['uuid','text','integer','integer','text','integer','text']);
select has_function('public', 'heartbeat_session', array['uuid','text','boolean']);
select has_function('public', 'release_session', array['uuid']);
select has_function('public', 'get_room_state', array['text']);
select has_function('public', 'cleanup_stale_anonymous_users', array['timestamp with time zone']);
select results_eq(
  $$select room_id from public.room_instances order by room_id$$,
  $$values ('cafe-01'::text),('cafe-02'::text),('cafe-03'::text)$$,
  'three stable cafe rooms are seeded'
);

select * from finish();
rollback;
