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
