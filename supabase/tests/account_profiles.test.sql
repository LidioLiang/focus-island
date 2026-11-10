begin;
create extension if not exists pgtap with schema extensions;
select plan(12);
insert into auth.users(id,instance_id,aud,role,is_anonymous,created_at,updated_at,raw_app_meta_data,raw_user_meta_data)
values('55555555-5555-4555-8555-555555555555','00000000-0000-0000-0000-000000000000','authenticated','authenticated',true,now(),now(),'{}','{}'),
('66666666-6666-4666-8666-666666666666','00000000-0000-0000-0000-000000000000','authenticated','authenticated',false,now(),now(),'{}','{}');
set local role authenticated;
select set_config('request.jwt.claim.sub','55555555-5555-4555-8555-555555555555',true);
select is(public.get_my_profile(),null::jsonb,'no profile from another user leaks');
select is(public.set_my_profile('Quiet Oak',2)->>'display_name','Quiet Oak','guest can edit own nickname');
select is(public.set_my_profile('Quiet Oak',1)->>'avatar_source','builtin','guest can choose an avatar');
select lives_ok($$select public.upsert_my_profile('Stale client',0)$$,'legacy presence still works');
select is(public.get_my_profile()->>'display_name','Quiet Oak','stale reservations do not overwrite edited profile');
select throws_ok($$select public.set_my_profile('',0)$$,'P0001','invalid_profile','empty names rejected');
select throws_ok($$select public.set_my_profile('Quiet Oak',4)$$,'P0001','invalid_profile','invalid presets rejected');
select throws_ok($$select public.set_my_profile('Quiet Oak',1,'https://evil.invalid/photo.svg','google')$$,'P0001','invalid_avatar','untrusted provider URL rejected');
select throws_ok($$select public.set_my_profile('Quiet Oak',1,'https://example.supabase.co/storage/v1/object/public/profile-avatars/66666666-6666-4666-8666-666666666666/a.webp','upload')$$,'P0001','invalid_avatar','another user upload cannot be selected');
select set_config('request.jwt.claim.sub','66666666-6666-4666-8666-666666666666',true);
select is(public.get_my_profile(),null::jsonb,'profile RPC is scoped to current user');
select is(public.set_my_profile('Misty Morning',0)->>'display_name','Misty Morning','second account has separate profile');
select set_config('request.jwt.claim.sub','55555555-5555-4555-8555-555555555555',true);
select is(public.get_my_profile()->>'display_name','Quiet Oak','other account cannot overwrite first profile');
select * from finish();
rollback;
