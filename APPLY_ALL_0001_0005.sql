-- ============================================================
-- Reputation Autopilot — combined schema (0001–0005)
-- Paste this whole file into Supabase Dashboard → SQL Editor → Run.
-- Apply 0006_cron.sql separately, later (needs pg_cron/pg_net + deployed functions).
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0001_init.sql
-- ────────────────────────────────────────────────────────────
-- ============================================================================
-- Reputation Autopilot — initial schema
-- See Docs/SRS.md §5. Multi-tenant; every tenant table is RLS-protected.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ── helper: updated_at trigger ──────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── 5.2.1 profiles (1:1 with auth.users) ────────────────────────────────────
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  locale text default 'en',
  created_at timestamptz default now()
);

-- Auto-create a profile row when a new auth user signs up.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── 5.2.2 businesses (tenant root) ──────────────────────────────────────────
create table businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  name text not null,
  category text,
  country text,
  city text,
  timezone text default 'Asia/Karachi',
  currency text default 'PKR',
  brand_tone text default 'friendly' check (brand_tone in ('friendly','formal','short')),
  languages text[] default '{en}',
  quiet_hours int4range,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger businesses_updated before update on businesses
  for each row execute function set_updated_at();

-- ── 5.2.3 memberships (user ↔ business, role) ───────────────────────────────
create table memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','staff')),
  created_at timestamptz default now(),
  unique (business_id, user_id)
);
create index memberships_user_idx on memberships(user_id);

-- ── 5.2.4 google_locations ──────────────────────────────────────────────────
create table google_locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  google_account_id text not null,
  google_location_id text not null,
  display_name text,
  review_link text,
  refresh_token_encrypted text not null,
  last_synced_at timestamptz,
  status text default 'connected' check (status in ('connected','revoked','error')),
  created_at timestamptz default now(),
  unique (business_id, google_location_id)
);

-- ── 5.2.5 customers ─────────────────────────────────────────────────────────
create table customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text,
  phone text not null,
  tags text[] default '{}',
  consent boolean default true,
  source text check (source in ('manual','csv','pos')),
  last_request_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  unique (business_id, phone)
);
create index customers_business_idx on customers(business_id);

-- ── 5.2.6 review_requests ───────────────────────────────────────────────────
create table review_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  location_id uuid references google_locations(id),
  channel text not null check (channel in ('whatsapp','sms')),
  status text not null default 'queued'
    check (status in ('queued','sent','delivered','clicked','reviewed','failed')),
  template_name text,
  short_token text unique,
  provider_message_id text,
  idempotency_key text unique,
  error text,
  sent_at timestamptz,
  delivered_at timestamptz,
  clicked_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);
create index review_requests_business_status_idx on review_requests(business_id, status);
create index review_requests_customer_idx on review_requests(customer_id, created_at desc);

-- ── 5.2.7 reviews ───────────────────────────────────────────────────────────
create table reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  location_id uuid references google_locations(id),
  source text default 'google',
  google_review_id text not null,
  rating int not null check (rating between 1 and 5),
  text text,
  author_name text,
  reply_text text,
  reply_status text default 'none' check (reply_status in ('none','drafted','posted','failed')),
  review_created_at timestamptz,
  ingested_at timestamptz default now(),
  unique (business_id, google_review_id)
);
create index reviews_business_created_idx on reviews(business_id, review_created_at desc);
create index reviews_business_reply_idx on reviews(business_id, reply_status);

-- ── 5.2.8 ai_drafts ─────────────────────────────────────────────────────────
create table ai_drafts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  review_id uuid not null references reviews(id) on delete cascade,
  model text,
  prompt_tokens int,
  completion_tokens int,
  draft_text text,
  status text default 'draft' check (status in ('draft','edited','posted')),
  created_at timestamptz default now()
);

-- ── 5.2.9 alerts ────────────────────────────────────────────────────────────
create table alerts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  review_id uuid references reviews(id) on delete cascade,
  type text not null default 'bad_review',
  channel text default 'whatsapp',
  sent_at timestamptz,
  acknowledged_at timestamptz,
  acknowledged_by uuid references auth.users(id),
  created_at timestamptz default now()
);
create index alerts_unacked_idx on alerts(business_id) where acknowledged_at is null;

-- ── 5.2.10 subscriptions ────────────────────────────────────────────────────
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references businesses(id) on delete cascade,
  plan text not null default 'trial' check (plan in ('trial','starter','pro')),
  status text not null default 'trialing'
    check (status in ('trialing','active','past_due','canceled','manual_pending')),
  provider text default 'stripe' check (provider in ('stripe','manual')),
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now()
);

-- ── 5.2.11 usage_counters ───────────────────────────────────────────────────
create table usage_counters (
  business_id uuid not null references businesses(id) on delete cascade,
  period_month date not null,
  requests_sent int default 0,
  ai_replies int default 0,
  primary key (business_id, period_month)
);

-- ── 5.2.12 manual_payments ──────────────────────────────────────────────────
create table manual_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  plan text not null,
  amount int not null,
  currency text not null,
  proof_path text,
  status text default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- ── 5.2.13 audit_log ────────────────────────────────────────────────────────
create table audit_log (
  id bigserial primary key,
  business_id uuid,
  actor_id uuid,
  action text not null,
  entity text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- 0002_rls.sql
-- ────────────────────────────────────────────────────────────
-- ============================================================================
-- Row-Level Security — deny by default, scope every tenant table to the
-- caller's memberships. See Docs/SRS.md §5.4 and Docs/ARCHITECTURE.md §10.
-- ============================================================================

-- Businesses the current user belongs to (any role).
create or replace function auth_business_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select business_id from memberships where user_id = auth.uid()
$$;

-- Businesses where the current user is the owner.
create or replace function auth_owned_business_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select business_id from memberships where user_id = auth.uid() and role = 'owner'
$$;

-- ── profiles ─────────────────────────────────────────────────────────────
alter table profiles enable row level security;
create policy profiles_self on profiles for all
  using (id = auth.uid()) with check (id = auth.uid());

-- ── businesses ───────────────────────────────────────────────────────────
alter table businesses enable row level security;
create policy businesses_member_select on businesses for select
  using (id in (select auth_business_ids()));
create policy businesses_owner_insert on businesses for insert
  with check (owner_id = auth.uid());
create policy businesses_owner_modify on businesses for update
  using (id in (select auth_owned_business_ids()))
  with check (id in (select auth_owned_business_ids()));
create policy businesses_owner_delete on businesses for delete
  using (id in (select auth_owned_business_ids()));

-- ── memberships ──────────────────────────────────────────────────────────
alter table memberships enable row level security;
create policy memberships_select on memberships for select
  using (business_id in (select auth_business_ids()));
create policy memberships_owner_write on memberships for all
  using (business_id in (select auth_owned_business_ids()))
  with check (business_id in (select auth_owned_business_ids()));

-- ── generic tenant tables (member read+write) ──────────────────────────────
-- google_locations
alter table google_locations enable row level security;
create policy gl_rw on google_locations for all
  using (business_id in (select auth_business_ids()))
  with check (business_id in (select auth_business_ids()));

-- customers
alter table customers enable row level security;
create policy customers_rw on customers for all
  using (business_id in (select auth_business_ids()))
  with check (business_id in (select auth_business_ids()));

-- review_requests
alter table review_requests enable row level security;
create policy review_requests_rw on review_requests for all
  using (business_id in (select auth_business_ids()))
  with check (business_id in (select auth_business_ids()));

-- reviews
alter table reviews enable row level security;
create policy reviews_rw on reviews for all
  using (business_id in (select auth_business_ids()))
  with check (business_id in (select auth_business_ids()));

-- ai_drafts
alter table ai_drafts enable row level security;
create policy ai_drafts_rw on ai_drafts for all
  using (business_id in (select auth_business_ids()))
  with check (business_id in (select auth_business_ids()));

-- alerts
alter table alerts enable row level security;
create policy alerts_rw on alerts for all
  using (business_id in (select auth_business_ids()))
  with check (business_id in (select auth_business_ids()));

-- usage_counters (read only for members; writes via service role)
alter table usage_counters enable row level security;
create policy usage_select on usage_counters for select
  using (business_id in (select auth_business_ids()));

-- ── billing tables (owner-only) ─────────────────────────────────────────────
alter table subscriptions enable row level security;
create policy subscriptions_select on subscriptions for select
  using (business_id in (select auth_business_ids()));
create policy subscriptions_owner_write on subscriptions for all
  using (business_id in (select auth_owned_business_ids()))
  with check (business_id in (select auth_owned_business_ids()));

alter table manual_payments enable row level security;
create policy manual_payments_owner on manual_payments for all
  using (business_id in (select auth_owned_business_ids()))
  with check (business_id in (select auth_owned_business_ids()));

-- ── audit_log: no client access (service role only) ─────────────────────────
alter table audit_log enable row level security;
-- (No policies = deny all for anon/authenticated. Service role bypasses RLS.)

-- ── google_locations: hide encrypted token from clients ─────────────────────
-- Revoke column access so the refresh token is never selectable by clients.
revoke select (refresh_token_encrypted) on google_locations from anon, authenticated;

-- ────────────────────────────────────────────────────────────
-- 0003_business_bootstrap.sql
-- ────────────────────────────────────────────────────────────
-- ============================================================================
-- Business bootstrap — when a business is created, atomically grant the owner
-- their membership and open a 14-day trial subscription.
--
-- Why a trigger: the memberships RLS insert policy depends on
-- auth_owned_business_ids(), which reads `memberships` — so the very first
-- owner row can't be inserted by the client (chicken-and-egg). Doing it in a
-- SECURITY DEFINER trigger keeps creation atomic and race-free, mirroring the
-- existing handle_new_user() pattern. See Docs/ARCHITECTURE.md §10.
-- ============================================================================

create or replace function handle_new_business()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Owner membership (idempotent under the (business_id, user_id) unique index).
  insert into public.memberships (business_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (business_id, user_id) do nothing;

  -- Open a trial subscription (one per business — unique on business_id).
  insert into public.subscriptions (business_id, plan, status, provider, trial_ends_at)
  values (new.id, 'trial', 'trialing', 'manual', now() + interval '14 days')
  on conflict (business_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_business_created on businesses;
create trigger on_business_created
  after insert on businesses
  for each row execute function handle_new_business();

-- ────────────────────────────────────────────────────────────
-- 0004_dashboard_metrics.sql
-- ────────────────────────────────────────────────────────────
-- ============================================================================
-- dashboard_metrics(p_business) — aggregate review stats for the dashboard.
--
-- NOT security-definer: it runs with the caller's privileges so RLS on
-- `reviews` still applies (a non-member sees zero rows → all-zero metrics, no
-- leak). One round-trip instead of pulling every row into the app (ARCH §9).
-- ============================================================================
create or replace function dashboard_metrics(p_business uuid)
returns jsonb language sql stable as $$
  select jsonb_build_object(
    'total',         count(*),
    'avg_rating',    coalesce(round(avg(rating)::numeric, 2), 0),
    'replied',       count(*) filter (where reply_status = 'posted'),
    'new_this_week', count(*) filter (
                       where coalesce(review_created_at, ingested_at) >= now() - interval '7 days'),
    'prev_week',     count(*) filter (
                       where coalesce(review_created_at, ingested_at) >= now() - interval '14 days'
                         and coalesce(review_created_at, ingested_at) <  now() - interval '7 days')
  )
  from reviews
  where business_id = p_business;
$$;

-- ────────────────────────────────────────────────────────────
-- 0005_bad_review_alert.sql
-- ────────────────────────────────────────────────────────────
-- ============================================================================
-- Bad-review alerts — when a 1- or 2-star review is ingested, raise an alert
-- for the owner (FR-ALERT-1). Doing it in a trigger keeps alerting consistent
-- regardless of how the review arrived (Google poll, import, manual).
-- The send-alert edge function later picks up rows where sent_at is null and
-- delivers the WhatsApp/email notification.
-- ============================================================================
create or replace function handle_bad_review()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.rating <= 2 then
    insert into public.alerts (business_id, review_id, type, channel)
    values (new.business_id, new.id, 'bad_review', 'whatsapp');
  end if;
  return new;
end;
$$;

drop trigger if exists on_review_ingested on reviews;
create trigger on_review_ingested
  after insert on reviews
  for each row execute function handle_bad_review();
