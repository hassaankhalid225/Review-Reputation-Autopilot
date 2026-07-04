-- ============================================================================
-- 0008_email_channel.sql — Email as a review-request channel.
--
-- Adds an optional email to customers and widens the review_requests channel
-- constraint so requests can be sent by email (via the ResendEmailSender adapter)
-- alongside WhatsApp and SMS. See Docs/ARCHITECTURE.md §6.4 (MessageSender port).
-- ============================================================================

alter table customers add column if not exists email text;

alter table review_requests drop constraint if exists review_requests_channel_check;
alter table review_requests
  add constraint review_requests_channel_check
  check (channel in ('whatsapp','sms','email'));
