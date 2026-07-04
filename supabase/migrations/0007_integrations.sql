-- ============================================================================
-- 0007_integrations.sql — Multi-platform review sources + website widget.
--
-- Generalises the single-provider `google_locations` model into `review_sources`
-- so a business can connect many places customers review it (Google, Facebook,
-- Instagram, Yelp, TripAdvisor, Trustpilot). One row per (business, platform).
--
-- Also adds `widget_settings` for the embeddable website review widget.
-- See Docs/SRS.md §5 (data model) and Docs/ARCHITECTURE.md §6 (ports/adapters).
-- ============================================================================

-- ── review_sources ──────────────────────────────────────────────────────────
create table review_sources (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  platform text not null check (platform in
    ('google','facebook','instagram','yelp','tripadvisor','trustpilot')),
  external_id text,                       -- page/business id on the platform
  display_name text,                      -- listing name as shown on the platform
  review_link text,                       -- public "leave a review" URL
  profile_url text,                       -- public listing URL
  credentials_encrypted text,             -- AES-GCM JSON blob of tokens/keys (nullable for link-only)
  avg_rating numeric(2,1),                -- cached for analytics
  review_count int default 0,             -- cached for analytics
  status text default 'connected'
    check (status in ('connected','pending','revoked','error')),
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (business_id, platform)
);
create index review_sources_business_idx on review_sources(business_id);

create trigger review_sources_updated
  before update on review_sources
  for each row execute function set_updated_at();

-- ── widget_settings ─────────────────────────────────────────────────────────
create table widget_settings (
  business_id uuid primary key references businesses(id) on delete cascade,
  enabled boolean default true,
  min_rating int default 4 check (min_rating between 1 and 5),
  theme text default 'auto' check (theme in ('auto','light','dark')),
  layout text default 'grid' check (layout in ('grid','carousel','list')),
  accent text default '#4f46e5',
  headline text,
  max_reviews int default 6 check (max_reviews between 1 and 24),
  updated_at timestamptz default now()
);

create trigger widget_settings_updated
  before update on widget_settings
  for each row execute function set_updated_at();

-- ── RLS (deny-by-default, tenant-isolated — mirrors 0002_rls.sql) ────────────
alter table review_sources enable row level security;
create policy review_sources_rw on review_sources for all
  using (business_id in (select auth_business_ids()))
  with check (business_id in (select auth_business_ids()));

-- Never expose encrypted credentials to browser clients.
revoke select (credentials_encrypted) on review_sources from anon, authenticated;

alter table widget_settings enable row level security;
create policy widget_settings_rw on widget_settings for all
  using (business_id in (select auth_business_ids()))
  with check (business_id in (select auth_business_ids()));
