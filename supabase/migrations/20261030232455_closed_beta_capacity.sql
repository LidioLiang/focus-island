-- Focus Isle v1.1: optional, atomic closed-beta capacity gate.

create table public.closed_beta_settings (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  max_members integer not null default 100 check (max_members between 1 and 50000),
  updated_at timestamptz not null default now()
);

insert into public.closed_beta_settings (id, enabled, max_members)
values (true, false, 100)
on conflict (id) do nothing;

create table public.closed_beta_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  admitted_at timestamptz not null default now()
);

alter table public.closed_beta_settings enable row level security;
alter table public.closed_beta_members enable row level security;
revoke all on public.closed_beta_settings, public.closed_beta_members from anon, authenticated;

create or replace function public.claim_my_closed_beta_slot()
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_user auth.users;
  v_settings public.closed_beta_settings;
  v_member_count integer;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into v_user from auth.users where id = auth.uid();
  if not found or v_user.is_anonymous is true then raise exception 'registration_required'; end if;
  if v_user.email_confirmed_at is null then raise exception 'email_verification_required'; end if;

  if coalesce(v_user.raw_app_meta_data->>'role', '') = 'developer' then
    return jsonb_build_object('enabled', true, 'admitted', true, 'developer', true);
  end if;

  select * into v_settings from public.closed_beta_settings where id is true for update;
  if not found or v_settings.enabled is false then
    return jsonb_build_object('enabled', false, 'admitted', true);
  end if;

  if exists(select 1 from public.closed_beta_members where user_id = auth.uid()) then
    select count(*) into v_member_count from public.closed_beta_members;
    return jsonb_build_object(
      'enabled', true, 'admitted', true,
      'memberCount', v_member_count, 'maxMembers', v_settings.max_members
    );
  end if;

  select count(*) into v_member_count from public.closed_beta_members;
  if v_member_count >= v_settings.max_members then raise exception 'closed_beta_full'; end if;

  insert into public.closed_beta_members (user_id) values (auth.uid());
  return jsonb_build_object(
    'enabled', true, 'admitted', true,
    'memberCount', v_member_count + 1, 'maxMembers', v_settings.max_members
  );
end;
$$;

revoke all on function public.claim_my_closed_beta_slot() from public, anon;
grant execute on function public.claim_my_closed_beta_slot() to authenticated;

create or replace function public.get_my_access_status()
returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare
  v_user auth.users;
  v_access public.user_access_state;
  v_entitlement public.entitlements;
  v_subscription public.subscriptions;
  v_is_developer boolean := false;
begin
  if auth.uid() is null then raise exception 'authentication_required'; end if;
  select * into v_user from auth.users where id = auth.uid();
  if not found then raise exception 'authentication_required'; end if;
  if v_user.is_anonymous is true then
    return jsonb_build_object(
      'authenticated', true, 'emailVerified', false, 'accountType', 'anonymous',
      'trialStatus', 'unavailable', 'entitlementType', 'none',
      'subscriptionStatus', null, 'canEnterProduct', false, 'canStartFocus', false,
      'paywallReason', 'registration_required'
    );
  end if;
  if v_user.email_confirmed_at is null then
    return jsonb_build_object(
      'authenticated', true, 'emailVerified', false, 'accountType', 'permanent',
      'trialStatus', 'unavailable', 'entitlementType', 'none',
      'subscriptionStatus', null, 'canEnterProduct', false, 'canStartFocus', false,
      'paywallReason', 'email_verification_required'
    );
  end if;

  perform public.claim_my_closed_beta_slot();
  v_is_developer := coalesce(v_user.raw_app_meta_data->>'role', '') = 'developer';
  insert into public.user_access_state (user_id) values (v_user.id)
    on conflict (user_id) do nothing;
  select * into v_access from public.user_access_state where user_id = v_user.id;
  select * into v_entitlement from public.entitlements
    where user_id = v_user.id and entitlement_key = 'focus_core_access' and active
      and (expires_at is null or expires_at > now())
    order by case source_type when 'lifetime' then 1 when 'subscription' then 2 else 3 end
    limit 1;
  if v_entitlement.source_type = 'subscription' then
    select * into v_subscription from public.subscriptions
      where provider_subscription_id = v_entitlement.source_id limit 1;
  end if;
  return jsonb_build_object(
    'authenticated', true,
    'emailVerified', true,
    'accountType', 'permanent',
    'trialStatus', v_access.trial_status,
    'entitlementType', case when v_is_developer then 'admin' else coalesce(v_entitlement.source_type, 'none') end,
    'subscriptionStatus', case when v_is_developer then 'developer' else v_subscription.status end,
    'canEnterProduct', true,
    'canStartFocus', v_is_developer or v_entitlement.id is not null or v_access.trial_status in ('available', 'in_progress'),
    'paywallReason', case when not v_is_developer and v_entitlement.id is null and v_access.trial_status = 'consumed' then 'payment_required' else null end
  );
end;
$$;
