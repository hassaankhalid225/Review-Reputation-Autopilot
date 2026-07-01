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
