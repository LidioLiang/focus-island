begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values
  ('11111111-1111-4111-8111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'seat-one@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb),
  ('22222222-2222-4222-8222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'seat-two@example.test', '', now(), now(), now(), '{}'::jsonb, '{}'::jsonb);

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select lives_ok($$select public.upsert_my_profile('User One', 0)$$, 'user one can create a profile');
select is(public.allocate_room('cafe', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'User One', 0)->>'roomId', 'cafe-01', 'first user receives first stable room');
select is((public.reserve_seat('cafe-01', 1, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'User One', 0, '安静专注')->>'ok')::boolean, true, 'user one reserves seat');
select is((public.occupy_seat('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'cafe-01', 1)->>'ok')::boolean, true, 'reservation becomes occupied');
select is((public.heartbeat_session('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '专注计时中', true)->'lease'->>'state'), 'occupied', 'heartbeat preserves occupied state');
reset role;
select ok((select focus_started_at is not null from public.seat_leases where session_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 'focusing heartbeat starts focus time');

set local role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);
select is(public.allocate_room('cafe', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'User Two', 1)->>'roomId', 'cafe-01', 'allocator prefers an existing non-full human room');
select throws_ok(
  $$select public.reserve_seat('cafe-01', 1, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'User Two', 1, '安静专注')$$,
  'P0001', 'seat_taken', 'second user cannot take an occupied seat'
);
select is((public.release_session('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')->>'ok')::boolean, true, 'cross-owner release is harmless');
reset role;
select is((select count(*)::integer from public.seat_leases where session_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), 1, 'cross-owner release does not delete another user lease');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select is((public.switch_seat('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'cafe-01', 1, 2, 'User One', 0, '换座')->>'seatId')::integer, 2, 'owner can switch seats atomically');
select is((public.release_session('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')->>'ok')::boolean, true, 'owner can release session');

select * from finish();
rollback;
