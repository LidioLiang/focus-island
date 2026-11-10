begin;
create extension if not exists pgtap with schema extensions;
select plan(12);
-- Random test identities live only in this rolled-back transaction.
insert into auth.users(id,instance_id,aud,role,is_anonymous,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
values ('33333333-3333-4333-8333-333333333333','00000000-0000-0000-0000-000000000000','authenticated','authenticated',true,now(),now(),'{}','{"role":"developer"}'),
('44444444-4444-4444-8444-444444444444','00000000-0000-0000-0000-000000000000','authenticated','authenticated',false,now(),now(),'{}','{}');
set local role authenticated;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
select is(public.get_my_access_status()->>'accountType','anonymous','guest retains anonymous identity');
select is(public.get_my_access_status()->>'canStartFocus','true','guest can focus without registration');
select is(public.get_my_access_status()->>'entitlementType','none','user metadata cannot grant developer');
select is(public.start_my_focus_session('guest-session-one','cafe','cafe-local',1,50)->'session'->>'is_trial','false','50 minute base session is free');
select is(public.start_my_focus_session('guest-session-one','cafe','cafe-local',1,50)->>'resumed','true','retries are idempotent');
select throws_ok($$select public.start_my_focus_session('guest-session-two','cafe','cafe-local',2,25)$$,'P0001','active_session_exists','one active session enforced');
select lives_ok($$select public.update_my_focus_session('guest-session-one','ended_early',12,0)$$,'guest can end owned session');
select is(public.update_my_focus_session('guest-session-one','running',0,0)->>'status','ended_early','delayed request cannot reopen ended session');
select lives_ok($$select public.start_my_focus_session('guest-session-two','cafe','cafe-local',2,0)$$,'guest can start another free session');
select is((select count(*)::integer from public.focus_sessions),2,'guest can read own records');
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
select is((select count(*)::integer from public.focus_sessions),0,'another identity cannot read guest history');
select throws_ok($$select public.update_my_focus_session('guest-session-two','interrupted',50,0)$$,'P0001','focus_session_not_found','another identity cannot end guest focus');
select * from finish();
rollback;
