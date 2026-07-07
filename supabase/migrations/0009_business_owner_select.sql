-- ============================================================================
-- Fix: business creation fails with 42501 on INSERT ... RETURNING.
--
-- createBusinessAction → repository does `.insert(...).select("*").single()`,
-- i.e. INSERT ... RETURNING. PostgREST evaluates the SELECT policy against the
-- returned row. The old policy made visibility depend on a `memberships` row —
-- but that row is created by the AFTER INSERT trigger (handle_new_business) in
-- the SAME statement, so it isn't visible to the RETURNING snapshot. Result:
-- every business creation is rejected with
--   "new row violates row-level security policy for table \"businesses\"".
--
-- Owners must always be able to see their own business row, independent of the
-- membership-bootstrap timing. Add owner_id = auth.uid() to the SELECT policy.
-- ============================================================================

drop policy if exists businesses_member_select on businesses;
create policy businesses_member_select on businesses for select
  using (owner_id = auth.uid() or id in (select auth_business_ids()));
