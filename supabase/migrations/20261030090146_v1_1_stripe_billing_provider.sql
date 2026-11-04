-- Focus Isle v1.1 billing-provider cutover: Paddle -> Stripe.
-- Production billing tables were verified empty before this migration.

alter table public.billing_customers
  drop constraint if exists billing_customers_provider_check;

alter table public.billing_customers
  alter column provider set default 'stripe';

alter table public.billing_customers
  add constraint billing_customers_provider_check check (provider = 'stripe');
