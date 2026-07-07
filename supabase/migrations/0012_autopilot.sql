-- ============================================================================
-- AI Autopilot — the owner's automation settings for AI review replies.
--
-- Surfaced on the /app/autopilot control centre and configured from Settings:
--   autopilot_enabled    : master switch for the automation.
--   autopilot_autopost    : when on, high-rated reviews get replied automatically;
--                           when off, Autopilot only drafts (owner approves & posts).
--   autopilot_min_rating  : only auto-post reviews at/above this rating; anything
--                           below is drafted for the owner to handle personally.
-- ============================================================================

alter table businesses
  add column if not exists autopilot_enabled   boolean not null default false,
  add column if not exists autopilot_autopost  boolean not null default false,
  add column if not exists autopilot_min_rating int    not null default 4;

alter table businesses
  drop constraint if exists businesses_autopilot_min_rating,
  add  constraint businesses_autopilot_min_rating
       check (autopilot_min_rating between 1 and 5);
