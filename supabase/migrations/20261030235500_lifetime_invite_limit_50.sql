-- Reduce the v1.1 founder lifetime invitation campaign from 500 to 50 total claims.
-- Refuse to lower the cap if an environment has already granted more than 50 claims.

do $$
begin
  if exists (
    select 1
    from public.lifetime_invite_campaigns
    where name = 'v1.1-founder-500'
      and claimed_count > 50
  ) then
    raise exception 'lifetime_invite_claims_exceed_new_limit';
  end if;
end
$$;

update public.lifetime_invite_campaigns
set name = 'v1.1-founder-50',
    max_claims = 50,
    updated_at = now()
where name = 'v1.1-founder-500';
