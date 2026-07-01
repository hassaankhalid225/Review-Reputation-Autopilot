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
