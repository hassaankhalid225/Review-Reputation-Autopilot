-- ============================================================
-- Missing migrations 0003–0005 (idempotent — safe to re-run).
-- 0001 + 0002 already applied (tables exist). Run THIS in SQL Editor.
-- Fixes: 'Could not create business' (0003 trigger makes owner membership + trial).
-- ============================================================

-- ── 0003_business_bootstrap.sql ──
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

-- ── 0004_dashboard_metrics.sql ──
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

-- ── 0005_bad_review_alert.sql ──
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
