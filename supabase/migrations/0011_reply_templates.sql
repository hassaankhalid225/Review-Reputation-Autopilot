-- ============================================================================
-- Owner-authored reply templates + brand facts.
--
-- The owner can add as many of their own review-reply templates as they like
-- (each optionally triggered by sentiment) and a free-form list of brand facts
-- (label → value). Both feed the AI drafter so replies come out in the owner's
-- own voice and reference the owner's own facts — and templates can also be
-- inserted verbatim when replying.
--
-- Stored as jsonb on the businesses row (small, always loaded with the tenant,
-- no cross-row queries needed). RLS on `businesses` already governs access.
--
--   reply_templates : [{ id, title, trigger, body }]
--                       trigger ∈ any | positive | mixed | negative
--   brand_facts     : [{ id, label, value }]
-- ============================================================================

alter table businesses
  add column if not exists reply_templates jsonb not null default '[]'::jsonb,
  add column if not exists brand_facts     jsonb not null default '[]'::jsonb;

-- Guard against a runaway paste bloating the row / AI prompt.
alter table businesses
  drop constraint if exists businesses_reply_templates_is_array,
  add  constraint businesses_reply_templates_is_array
       check (jsonb_typeof(reply_templates) = 'array' and jsonb_array_length(reply_templates) <= 30),
  drop constraint if exists businesses_brand_facts_is_array,
  add  constraint businesses_brand_facts_is_array
       check (jsonb_typeof(brand_facts) = 'array' and jsonb_array_length(brand_facts) <= 40);
