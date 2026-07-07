-- ============================================================================
-- Brand profile — let a business owner describe their brand from Settings.
--
-- These columns power three surfaces:
--   1. AI review replies      — description / ai_context / ai_signature / ai_avoid
--                               / reply_language make every draft on-brand.
--   2. The public review page  — logo_url / brand_color / tagline.
--   3. Customer touchpoints    — public_email / phone / whatsapp / website / socials.
--
-- All fields are optional; the app renders sensible fallbacks when they're null.
-- RLS is unchanged (owners already have full read/write on their own row).
-- ============================================================================

alter table businesses
  add column if not exists tagline        text,
  add column if not exists description    text,
  add column if not exists website        text,
  add column if not exists logo_url       text,
  add column if not exists brand_color    text default '#4f46e5',
  add column if not exists public_email   text,
  add column if not exists phone          text,
  add column if not exists whatsapp       text,
  add column if not exists address        text,
  add column if not exists socials        jsonb not null default '{}'::jsonb,
  add column if not exists ai_signature   text,
  add column if not exists ai_context     text,
  add column if not exists ai_avoid       text,
  add column if not exists reply_language text default 'en';

-- Keep description/context bounded so a runaway paste can't bloat the row or
-- the AI prompt. Length limits mirror the zod schema at the action boundary.
alter table businesses
  drop constraint if exists businesses_description_len,
  add  constraint businesses_description_len check (char_length(description) <= 1200),
  drop constraint if exists businesses_ai_context_len,
  add  constraint businesses_ai_context_len  check (char_length(ai_context)  <= 1500),
  drop constraint if exists businesses_brand_color_hex,
  add  constraint businesses_brand_color_hex check (brand_color is null or brand_color ~ '^#[0-9a-fA-F]{6}$');
