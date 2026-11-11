begin;
create extension if not exists pgtap with schema extensions;
select plan(12);
insert into auth.users(id,instance_id,aud,role,is_anonymous,created_at,updated_at,raw_app_meta_data,raw_user_meta_data) values
('77777777-7777-4777-8777-777777777777','00000000-0000-0000-0000-000000000000','authenticated','authenticated',true,now(),now(),'{}','{}'),
('88888888-8888-4888-8888-888888888888','00000000-0000-0000-0000-000000000000','authenticated','authenticated',true,now(),now(),'{}','{}');
select ok(not has_function_privilege('anon','public.reserve_and_occupy_seat(text,integer,uuid,text,integer,text)','EXECUTE'),'anonymous role cannot claim seats');
set local role authenticated;
select set_config('request.jwt.claim.sub','77777777-7777-4777-8777-777777777777',true);
select is(public.reserve_and_occupy_seat('forest-03',6,'aaaaaaaa-aaaa-4aaa-8aaa-777777777777','Reader',0,'Seated')->>'state','occupied','single call confirms occupied state');
reset role;
select is((select state from public.seat_leases where session_id='aaaaaaaa-aaaa-4aaa-8aaa-777777777777'),'occupied','lease committed occupied');
select is((select state from public.room_sessions where id='aaaaaaaa-aaaa-4aaa-8aaa-777777777777'),'occupied','session committed occupied');
select ok((select expires_at>now()+interval '40 seconds' from public.seat_leases where session_id='aaaaaaaa-aaaa-4aaa-8aaa-777777777777'),'occupied lease has heartbeat TTL');
set local role authenticated;
select set_config('request.jwt.claim.sub','88888888-8888-4888-8888-888888888888',true);
select throws_ok($$select public.reserve_and_occupy_seat('forest-03',6,'bbbbbbbb-bbbb-4bbb-8bbb-888888888888','Other',0,'Seated')$$,'P0001','seat_taken','second owner cannot claim the same seat');
reset role;
select is((select count(*)::int from public.room_sessions where id='bbbbbbbb-bbbb-4bbb-8bbb-888888888888'),0,'failed claim leaves no session');
select is((select user_id::text from public.seat_leases where room_id='forest-03' and seat_id=6),'77777777-7777-4777-8777-777777777777','original owner unchanged');
set local role authenticated;
select set_config('request.jwt.claim.sub','77777777-7777-4777-8777-777777777777',true);
select throws_ok($$select public.reserve_and_occupy_seat('cafe-01',1,'cccccccc-cccc-4ccc-8ccc-777777777777','Reader',0,'Seated')$$,'P0001','session_conflict','new identity cannot abandon a live owned seat');
select lives_ok($$select public.release_session('aaaaaaaa-aaaa-4aaa-8aaa-777777777777')$$,'normal release works');
select is(public.reserve_and_occupy_seat('cafe-03',6,'cccccccc-cccc-4ccc-8ccc-777777777777','Reader',0,'Seated')->>'state','occupied','cafe shares atomic entry');
select lives_ok($$select public.release_session('cccccccc-cccc-4ccc-8ccc-777777777777')$$,'atomic entry uses standard release lifecycle');
select * from finish();
rollback;
