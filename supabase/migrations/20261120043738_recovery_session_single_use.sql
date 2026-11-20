-- One verified recovery session can mint only one reset grant, including after consumption.
-- Never delete unexpired grants; retained consumed rows prevent token replay.
create unique index password_recovery_grants_session_unique on public.password_recovery_grants(user_id, session_id);
