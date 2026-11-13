begin;
create extension if not exists pgtap with schema extensions;
select plan(4);
select ok((select relrowsecurity from pg_class where oid='public.password_recovery_grants'::regclass), 'Recovery grants require RLS');
select ok(not has_table_privilege('authenticated','public.password_recovery_grants','SELECT'), 'Members cannot read recovery credentials');
select ok(not has_table_privilege('anon','public.password_recovery_grants','INSERT'), 'Anonymous visitors cannot mint recovery grants');
select ok(has_table_privilege('service_role','public.password_recovery_grants','UPDATE'), 'Server can atomically consume recovery grants');
select * from finish();
rollback;
