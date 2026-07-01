-- ============================================================================
-- Scheduled jobs — invoke the edge functions on a cadence via pg_cron + pg_net.
--
-- SETUP (run once per project, after deploying the functions):
--   1. supabase functions deploy poll-reviews send-message send-alert
--   2. Store project URL + service role key in Vault (Dashboard → Vault), named
--      'project_url' and 'service_role_key'. The cron jobs read them below so no
--      secret is hard-coded in source.
--
-- pg_cron schedules in UTC. Adjust cadences to taste.
-- ============================================================================
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Helper: POST to an edge function using the Vault-stored URL + key.
create or replace function invoke_edge_function(fn text)
returns void language plpgsql security definer set search_path = public, vault as $$
declare
  base_url text;
  service_key text;
begin
  select decrypted_secret into base_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into service_key from vault.decrypted_secrets where name = 'service_role_key';
  if base_url is null or service_key is null then
    raise notice 'invoke_edge_function: missing project_url/service_role_key in Vault';
    return;
  end if;

  perform net.http_post(
    url     := base_url || '/functions/v1/' || fn,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_key
    ),
    body    := '{}'::jsonb
  );
end;
$$;

-- Drain the outbound message queue every minute.
select cron.schedule('send-message-every-min', '* * * * *', $$select invoke_edge_function('send-message')$$);

-- Deliver pending bad-review alerts every minute.
select cron.schedule('send-alert-every-min', '* * * * *', $$select invoke_edge_function('send-alert')$$);

-- Poll Google for new reviews every 15 minutes.
select cron.schedule('poll-reviews-15min', '*/15 * * * *', $$select invoke_edge_function('poll-reviews')$$);
