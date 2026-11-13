create table public.password_recovery_grants (
  token_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null,
  expires_at timestamptz not null,
  consumed_at timestamptz
);
alter table public.password_recovery_grants enable row level security;
revoke all on public.password_recovery_grants from public, anon, authenticated;
grant select, insert, update, delete on public.password_recovery_grants to service_role;
create index password_recovery_grants_expiry_idx on public.password_recovery_grants(expires_at);
