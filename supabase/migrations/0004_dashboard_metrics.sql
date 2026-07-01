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
