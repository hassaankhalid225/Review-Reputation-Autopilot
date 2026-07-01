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
