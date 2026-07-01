# Software Requirements Specification (SRS) — Reputation Autopilot

| Field | Value |
|-------|-------|
| **Product** | Reputation Autopilot |
| **Document type** | Software Requirements Specification (IEEE 830-style) |
| **Version** | 1.0 |
| **Status** | Approved for MVP build |
| **Owner** | Muhammad Hassaan Khalid |
| **Last updated** | 2026-06-25 |
| **Related docs** | [PROJECT.md](PROJECT.md) · [PRD.md](PRD.md) · [USER_FLOW.md](USER_FLOW.md) |

---

## 1. Introduction

### 1.1 Purpose
This SRS defines the complete software requirements for **Reputation Autopilot**, a production-ready SaaS
platform built on **Supabase** (Postgres, Auth, Storage, Edge Functions, Cron) and **Next.js** on Vercel.
It is the authoritative technical contract for engineering, QA, and DevOps.

### 1.2 Scope
The system enables local businesses to collect Google reviews via WhatsApp/SMS, monitor reviews from
Google Business Profile, generate AI reply drafts (Claude), alert owners to bad reviews, and manage
subscriptions. This document covers functional behavior, data model, APIs, security, performance,
and operational requirements for the MVP and its immediate hardening.

### 1.3 Definitions, acronyms, abbreviations
| Term | Meaning |
|------|---------|
| GBP | Google Business Profile |
| RLS | Row-Level Security (Postgres) |
| Edge Function | Supabase serverless Deno function |
| BSP | Business Solution Provider (WhatsApp) |
| E.164 | International phone number format (`+923001234567`) |
| Idempotency key | Unique token to make a write safe to retry |
| Tenant | A `business` row; the unit of data isolation |

### 1.4 References
- IEEE Std 830-1998 (SRS structure).
- Supabase docs (Auth, RLS, Edge Functions, Cron, Realtime).
- Google Business Profile API reference.
- WhatsApp Cloud API & Twilio API docs.
- Claude API (Anthropic) reference — see `/claude-api` skill.

### 1.5 Overview
Section 2 gives the overall description; Section 3 enumerates functional requirements; Section 4 the
external interfaces; Section 5 the data model and RLS; Section 6 non-functional requirements; Sections
7–10 cover architecture, security, operations, and acceptance.

---

## 2. Overall description

### 2.1 Product perspective
A multi-tenant web application. Each **business** is a tenant; users belong to businesses via memberships.
The frontend (Next.js) talks to API routes / Edge Functions; Supabase Postgres is the system of record
with RLS enforcing tenant isolation. Background jobs (Supabase Cron + Edge Functions) handle review
polling, message sending, AI drafting, and alerts. External services: Google, WhatsApp/Twilio, Claude, Stripe.

```
┌──────────────┐     ┌─────────────────────────────┐     ┌─────────────────────┐
│  Browser      │◄──►│  Next.js (Vercel)            │◄──►│  Supabase            │
│  (owner/staff)│     │  - App Router UI             │     │  - Postgres + RLS    │
└──────────────┘     │  - API routes / Server Acts  │     │  - Auth              │
                     │  - Webhooks                  │     │  - Storage           │
                     └──────────────┬───────────────┘     │  - Edge Functions    │
                                    │                      │  - Cron / Realtime   │
              ┌─────────────────────┼─────────────────────┴─────────┐
              ▼                     ▼                                ▼
        Google GBP API      WhatsApp Cloud / Twilio            Claude API / Stripe
```

### 2.2 Product functions (summary)
1. Authentication & multi-tenant access control.
2. Business onboarding + Google Business Profile connection.
3. Customer management (manual + CSV).
4. Review request engine (WhatsApp/SMS, tracking, anti-spam).
5. Review monitoring (polling + storage + analytics).
6. AI reply drafting + posting to Google.
7. Bad-review alerting.
8. Billing, plans, and usage metering.
9. Settings, team, compliance (export/delete).

### 2.3 User classes & characteristics
| Class | Description | Tech level | Key permissions |
|-------|-------------|-----------|-----------------|
| Owner | Business buyer + admin | Low–medium | All within their business, incl. billing |
| Staff | Day-to-day operator | Low | Customers, requests, drafts; no billing |
| Platform admin | Founder/support | High | Cross-tenant admin (service role, audited) |

### 2.4 Operating environment
- **Client:** modern mobile/desktop browsers (Chrome, Safari, Edge), responsive ≥ 360px.
- **Server:** Vercel (Node 20 runtime), Supabase (managed Postgres 15+, Deno Edge runtime).
- **Regions:** Supabase region near primary market (e.g. `ap-south-1` / Singapore) for latency.

### 2.5 Design & implementation constraints
- Must use Supabase for DB/Auth/Storage/Functions/Cron (per stakeholder decision).
- All tenant tables MUST have RLS enabled and deny-by-default.
- No secret keys in client bundle; service-role key only in server/Edge contexts.
- WhatsApp business-initiated messages MUST use approved templates.
- Must comply with Google's anti-review-gating policy.

### 2.6 Assumptions & dependencies
- Owner has (or can create) a Google Business Profile they manage.
- WhatsApp Cloud API number is provisioned; templates approved (SMS fallback until then).
- Claude API key available; Stripe account active for global.

---

## 3. Functional requirements

Each requirement is testable. Priority: **M** = MVP must, **S** = should, **C** = could.

### 3.1 Authentication & authorization
- **FR-AUTH-1 (M):** Users can register/login via email+password and Google OAuth (Supabase Auth).
- **FR-AUTH-2 (M):** Email must be verified before any outbound message can be sent.
- **FR-AUTH-3 (M):** A user can belong to multiple businesses; active business is selectable.
- **FR-AUTH-4 (M):** Roles `owner`/`staff` enforced both in UI and via RLS policies.
- **FR-AUTH-5 (M):** Sessions use Supabase JWT; refresh handled by SDK; logout revokes session.
- **FR-AUTH-6 (S):** Password reset via email; rate-limited.

### 3.2 Business onboarding & Google connection
- **FR-BIZ-1 (M):** Owner creates a business: name, category, country, city, timezone, currency.
- **FR-BIZ-2 (M):** Owner connects GBP via Google OAuth; system stores encrypted refresh token + `account_id`/`location_id`.
- **FR-BIZ-3 (M):** On connect, backfill existing reviews (up to last 12 months) into `reviews`.
- **FR-BIZ-4 (S):** Owner can connect multiple locations (Pro); each location maps to one GBP location.
- **FR-BIZ-5 (M):** Owner can disconnect Google; tokens are revoked and deleted.

### 3.3 Customer management
- **FR-CUST-1 (M):** Add a customer with phone (required, normalized to E.164) + optional name/tags.
- **FR-CUST-2 (M):** CSV import with column mapping, validation, dedupe by phone, and an error report.
- **FR-CUST-3 (M):** List/search/filter customers; show last request time and status.
- **FR-CUST-4 (M):** Store consent flag and source; reject sends to customers without consent.
- **FR-CUST-5 (S):** Soft-delete a customer (retain for audit, exclude from sends).

### 3.4 Review request engine
- **FR-REQ-1 (M):** Send a review request to one or many customers via WhatsApp (primary) or SMS (fallback).
- **FR-REQ-2 (M):** Message uses an approved template with a tracked short link to the GBP review page.
- **FR-REQ-3 (M):** Each request has an idempotency key; retries never double-send.
- **FR-REQ-4 (M):** Track status: `queued → sent → delivered → clicked → reviewed → failed`.
- **FR-REQ-5 (M):** Anti-spam: block > 1 request per customer per 30 days (configurable) and enforce quiet hours.
- **FR-REQ-6 (M):** Respect plan request quota; block + prompt upgrade when exceeded.
- **FR-REQ-7 (M):** Click tracking via redirect endpoint that records `clicked_at` then 302s to Google.
- **FR-REQ-8 (S):** Inbound delivery webhooks (WhatsApp/Twilio) update delivery status.
- **FR-REQ-9 (M):** **Compliance:** the same public-review invite is sent to all customers — no sentiment pre-filter.

### 3.5 Review monitoring
- **FR-MON-1 (M):** Poll GBP reviews per location every 15 minutes via Cron + Edge Function.
- **FR-MON-2 (M):** Upsert reviews idempotently by Google review id; detect new/edited/deleted.
- **FR-MON-3 (M):** Compute dashboard metrics: avg rating, total reviews, response rate, new-this-week, unreplied count, rating trend.
- **FR-MON-4 (M):** Review feed with filters: rating, replied/unreplied, date range, location.
- **FR-MON-5 (S):** Realtime UI update when new reviews arrive (Supabase Realtime).

### 3.6 AI reply drafts
- **FR-AI-1 (M):** On new review, generate a reply draft via Claude (Haiku) using review text, rating, business name/category, brand tone, language.
- **FR-AI-2 (M):** Owner can Edit, Regenerate, or Post the draft.
- **FR-AI-3 (M):** Posting writes the reply to Google via `reviews.updateReply` and stores `reply_status`.
- **FR-AI-4 (M):** Guardrails: ≤ 700 chars, no invented facts, no unauthorized refunds/discounts, brand-safe tone.
- **FR-AI-5 (S):** Cache/store the prompt + model + tokens for cost tracking and audit.
- **FR-AI-6 (C):** Opt-in auto-post for 4–5 star reviews after a configurable delay (post-MVP).

### 3.7 Bad-review alerts
- **FR-ALERT-1 (M):** When an ingested review has rating ≤ 2, create an alert and send a WhatsApp alert to the owner within 2 minutes.
- **FR-ALERT-2 (M):** Alert message includes rating, snippet, and a deep link to the review in the dashboard.
- **FR-ALERT-3 (M):** Owner can Acknowledge; store `acknowledged_at` and `acknowledged_by`.
- **FR-ALERT-4 (S):** If unacknowledged in 1 hour, send a reminder (Pro escalation).

### 3.8 Billing & plans
- **FR-BILL-1 (M):** 14-day trial without a card; trial limits enforced.
- **FR-BILL-2 (M):** Stripe Checkout for global; webhook updates subscription status.
- **FR-BILL-3 (M):** Manual/JazzCash local flow: owner uploads payment proof → admin marks active.
- **FR-BILL-4 (M):** Meter usage (requests/mo, AI replies/mo, locations) and enforce plan limits.
- **FR-BILL-5 (M):** Stripe Customer Portal for upgrade/downgrade/cancel (global).
- **FR-BILL-6 (S):** Dunning/grace period on failed payment before suspension.

### 3.9 Settings, team & compliance
- **FR-SET-1 (M):** Edit business profile, brand tone, languages, quiet hours, notification channels.
- **FR-SET-2 (M):** Invite/remove staff; manage roles.
- **FR-SET-3 (M):** Export all business data (CSV/JSON).
- **FR-SET-4 (M):** Delete account/business → cascade delete + revoke external tokens (compliance).
- **FR-SET-5 (M):** Audit log of sensitive actions (sends, posts, billing, deletions).

### 3.10 Platform admin
- **FR-ADM-1 (M):** Founder admin panel (service-role, separate auth gate) to manage trials, manual payments, and support.
- **FR-ADM-2 (M):** All admin cross-tenant access is logged in `audit_log`.

---

## 4. External interface requirements

### 4.1 User interfaces
- Responsive web (mobile-first), Tailwind + shadcn/ui, WCAG AA color contrast.
- Key screens: Landing, Auth, Onboarding, Dashboard, Reviews, Requests, Customers, Settings, Billing, Admin.
- Loading, empty, and error states required for every data view.

### 4.2 Hardware interfaces
None beyond standard client devices.

### 4.3 Software/API interfaces
| Integration | Direction | Method | Notes |
|-------------|-----------|--------|-------|
| Supabase Auth | both | SDK/JWT | Sessions, OAuth |
| Supabase Postgres | both | PostgREST/SQL | RLS enforced |
| Google GBP API | out + in | REST | Reviews read, `updateReply`, OAuth tokens |
| WhatsApp Cloud API | out + in | REST + webhook | Templates, delivery status |
| Twilio | out + in | REST + webhook | SMS fallback |
| Claude API | out | REST | Haiku reply drafts |
| Stripe | out + in | REST + webhook | Checkout, Portal, subscription events |

### 4.4 Communications interfaces
- All external traffic over HTTPS/TLS 1.2+.
- Webhooks verified by signature (Stripe signing secret, WhatsApp/Twilio validation, GBP via polling).
- Idempotent webhook handlers keyed on provider event id.

---

## 5. Data model & database (Supabase / Postgres)

### 5.1 Conventions
- All tables in `public` schema unless noted; UUID primary keys (`gen_random_uuid()`).
- `created_at timestamptz default now()`, `updated_at` maintained by trigger.
- Every tenant table has `business_id uuid not null references businesses(id) on delete cascade`.
- **RLS enabled on every tenant table; deny by default.**
- Phone stored E.164; money in minor units (`integer`) + `currency`.

### 5.2 Core tables (DDL sketch)

```sql
-- 5.2.1 profiles (1:1 with auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  locale text default 'en',
  created_at timestamptz default now()
);

-- 5.2.2 businesses (tenant root)
create table businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  name text not null,
  category text,
  country text, city text,
  timezone text default 'Asia/Karachi',
  currency text default 'PKR',
  brand_tone text default 'friendly',   -- friendly | formal | short
  languages text[] default '{en}',
  quiet_hours int4range,                 -- e.g. [22,8)
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5.2.3 memberships (user ↔ business, role)
create table memberships (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','staff')),
  created_at timestamptz default now(),
  unique (business_id, user_id)
);

-- 5.2.4 google_locations (GBP connection per location)
create table google_locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  google_account_id text not null,
  google_location_id text not null,
  display_name text,
  review_link text,                      -- 1-click write-review URL
  refresh_token_encrypted text not null, -- encrypted via Vault/pgsodium
  last_synced_at timestamptz,
  status text default 'connected',       -- connected | revoked | error
  created_at timestamptz default now(),
  unique (business_id, google_location_id)
);

-- 5.2.5 customers
create table customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  name text,
  phone text not null,                   -- E.164
  tags text[] default '{}',
  consent boolean default true,
  source text,                           -- manual | csv | pos
  last_request_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  unique (business_id, phone)
);

-- 5.2.6 review_requests
create table review_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  location_id uuid references google_locations(id),
  channel text not null check (channel in ('whatsapp','sms')),
  status text not null default 'queued'
    check (status in ('queued','sent','delivered','clicked','reviewed','failed')),
  template_name text,
  short_token text unique,               -- tracking token in link
  provider_message_id text,
  idempotency_key text unique,
  error text,
  sent_at timestamptz, delivered_at timestamptz,
  clicked_at timestamptz, reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- 5.2.7 reviews
create table reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  location_id uuid references google_locations(id),
  source text default 'google',
  google_review_id text not null,
  rating int not null check (rating between 1 and 5),
  text text,
  author_name text,
  reply_text text,
  reply_status text default 'none'
    check (reply_status in ('none','drafted','posted','failed')),
  review_created_at timestamptz,
  ingested_at timestamptz default now(),
  unique (business_id, google_review_id)
);

-- 5.2.8 ai_drafts (audit + cost)
create table ai_drafts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  review_id uuid not null references reviews(id) on delete cascade,
  model text, prompt_tokens int, completion_tokens int,
  draft_text text,
  status text default 'draft',           -- draft | edited | posted
  created_at timestamptz default now()
);

-- 5.2.9 alerts
create table alerts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  review_id uuid references reviews(id) on delete cascade,
  type text not null default 'bad_review',
  channel text default 'whatsapp',
  sent_at timestamptz,
  acknowledged_at timestamptz,
  acknowledged_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- 5.2.10 subscriptions
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references businesses(id) on delete cascade,
  plan text not null default 'trial' check (plan in ('trial','starter','pro')),
  status text not null default 'trialing'
    check (status in ('trialing','active','past_due','canceled','manual_pending')),
  provider text default 'stripe',        -- stripe | manual
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now()
);

-- 5.2.11 usage_counters (per business per month)
create table usage_counters (
  business_id uuid not null references businesses(id) on delete cascade,
  period_month date not null,            -- first day of month
  requests_sent int default 0,
  ai_replies int default 0,
  primary key (business_id, period_month)
);

-- 5.2.12 manual_payments (local)
create table manual_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  plan text not null,
  amount int not null, currency text not null,
  proof_path text,                       -- Supabase Storage path
  status text default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- 5.2.13 audit_log
create table audit_log (
  id bigserial primary key,
  business_id uuid,
  actor_id uuid,
  action text not null,
  entity text, entity_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);
```

### 5.3 Relationships (ER summary)
- `businesses 1—* memberships *—1 auth.users`
- `businesses 1—* google_locations`, `1—* customers`, `1—* reviews`, `1—* review_requests`
- `reviews 1—* ai_drafts`, `reviews 1—* alerts`
- `businesses 1—1 subscriptions`, `1—* usage_counters`, `1—* manual_payments`

### 5.4 Row-Level Security (policy pattern)
A reusable helper plus per-table policies. Example for `customers`:

```sql
-- helper: businesses the current user belongs to
create or replace function auth_business_ids()
returns setof uuid language sql stable as $$
  select business_id from memberships where user_id = auth.uid()
$$;

alter table customers enable row level security;

create policy customers_select on customers for select
  using (business_id in (select auth_business_ids()));

create policy customers_modify on customers for all
  using (business_id in (select auth_business_ids()))
  with check (business_id in (select auth_business_ids()));
```

- Same pattern applies to all tenant tables.
- Billing writes restricted to `owner` role (check membership role in policy).
- `audit_log` and admin operations use the **service role** (bypasses RLS) from server context only.
- Encrypted token columns never selectable by clients (column-level: only Edge Functions read them).

### 5.5 Indexes & performance
- `reviews (business_id, review_created_at desc)`, `reviews (business_id, reply_status)`.
- `review_requests (business_id, status)`, `review_requests (customer_id, created_at desc)`.
- `customers (business_id, phone)` unique; trigram index on `name`/`phone` for search.
- `alerts (business_id, acknowledged_at)` partial index where `acknowledged_at is null`.

### 5.6 Storage buckets
- `payment-proofs` (private) — manual payment uploads, RLS-scoped by business.
- `csv-imports` (private, transient) — uploaded customer CSVs, auto-expire.

---

## 6. Non-functional requirements

### 6.1 Performance
- **NFR-PERF-1:** Dashboard first contentful paint < 2s on a 3G connection.
- **NFR-PERF-2:** API/Server Action p95 latency < 500ms (excluding 3rd-party calls).
- **NFR-PERF-3:** Review poll job processes 1 location in < 5s; whole fleet within the 15-min window.
- **NFR-PERF-4:** AI draft generation returns < 4s p95.

### 6.2 Scalability
- **NFR-SCALE-1:** Support 1,000 businesses and 200,000 customers without schema redesign.
- **NFR-SCALE-2:** Background jobs horizontally scalable; polling sharded by location id.

### 6.3 Availability & reliability
- **NFR-AVAIL-1:** 99.5% monthly uptime target.
- **NFR-REL-1:** All external sends idempotent; at-least-once with dedupe → effectively once.
- **NFR-REL-2:** Failed jobs retried with exponential backoff (max 5) then dead-lettered + alerted.

### 6.4 Security
- **NFR-SEC-1:** RLS on every tenant table, deny-by-default.
- **NFR-SEC-2:** Secrets in Supabase Vault / Vercel env; never in client bundle.
- **NFR-SEC-3:** Google/WhatsApp refresh tokens encrypted at rest (pgsodium/Vault).
- **NFR-SEC-4:** All webhooks signature-verified; replay-protected via event-id dedupe.
- **NFR-SEC-5:** Rate limiting on auth, send, and AI endpoints.
- **NFR-SEC-6:** Principle of least privilege; service-role key only server-side.
- **NFR-SEC-7:** Audit log for sends, posts, billing, deletions, admin access.

### 6.5 Privacy & compliance
- **NFR-PRIV-1:** Data export and account deletion supported (GDPR / Pakistan PDPB readiness).
- **NFR-PRIV-2:** Customer consent recorded; opt-out honored (STOP keyword for SMS).
- **NFR-PRIV-3:** **No review gating** — all customers receive the same public review invite.
- **NFR-PRIV-4:** WhatsApp messaging only via approved templates within policy windows.

### 6.6 Usability & accessibility
- **NFR-UX-1:** Core flows completable on mobile in ≤ 3 taps from dashboard.
- **NFR-UX-2:** WCAG 2.1 AA contrast; keyboard navigable; screen-reader labels.
- **NFR-UX-3:** Bilingual UI strings (English + Urdu/Hindi romanized) via i18n.

### 6.7 Maintainability & observability
- **NFR-MAINT-1:** Typed end-to-end (TypeScript); DB types generated from Supabase.
- **NFR-OBS-1:** Structured logs, error tracking (Sentry), and a metrics dashboard.
- **NFR-OBS-2:** Health checks for poll/send/AI jobs; alert on failure rate > 5%.

### 6.8 Localization
- Timezone-aware scheduling (quiet hours per business timezone).
- Currency formatting per business; pricing tables localized.

---

## 7. System architecture

### 7.1 Components
- **Web app (Next.js App Router):** UI, server actions, API routes, webhook receivers.
- **Supabase Postgres:** system of record + RLS.
- **Supabase Auth:** identity, OAuth, sessions.
- **Supabase Edge Functions:** `poll-reviews`, `send-message`, `generate-draft`, `post-reply`, `send-alert`, webhook processors.
- **Supabase Cron:** schedules `poll-reviews` (*/15 min), `escalate-alerts` (hourly), `reset-usage` (monthly).
- **Supabase Storage:** payment proofs, CSV uploads.
- **Supabase Realtime:** push new reviews/alerts to the dashboard.

### 7.2 Key flows (technical)
- **Send request:** server action → enforce quota/anti-spam → insert `review_requests(queued)` with idempotency key → `send-message` Edge Function → provider → update status; redirect endpoint records clicks.
- **Poll reviews:** Cron → `poll-reviews` per location → upsert `reviews` → enqueue `generate-draft` → if rating ≤ 2 enqueue `send-alert`.
- **Post reply:** owner approves → `post-reply` Edge Function → GBP `updateReply` → set `reply_status='posted'`.
- **Billing:** Stripe webhook → verify signature → upsert `subscriptions` → adjust limits.

### 7.3 Idempotency & jobs
- Outbound sends keyed by `idempotency_key`; provider message id stored.
- Webhooks deduped by provider event id (unique constraint).
- Jobs are retry-safe; partial failures isolated per location/customer.

---

## 8. Security requirements (detail)
- OWASP Top 10 mitigations (injection via parameterized queries/PostgREST, XSS via React escaping + CSP, CSRF via same-site cookies + signed actions).
- Content Security Policy and HSTS headers.
- Least-privilege DB roles; RLS verified by automated tests (positive + negative tenant access).
- Encrypted secrets; rotation procedure documented.
- PII minimization: store only phone + optional name for customers.

---

## 9. Operational requirements (DevOps)
- **Environments:** `local`, `staging`, `production` Supabase projects + Vercel envs.
- **Migrations:** Supabase CLI migrations in version control; no manual prod schema edits.
- **CI/CD:** lint, typecheck, test, run migrations on deploy; preview deploys per PR.
- **Backups:** daily automated Postgres backups; point-in-time recovery enabled.
- **Monitoring:** Sentry (errors), uptime checks, job-failure alerts to founder.
- **Runbooks:** token revocation, provider outage fallback (WhatsApp→SMS), incident response.

---

## 10. Acceptance criteria (system-level)
The MVP is accepted when, in staging with real test accounts:
1. A new owner signs up, verifies email, creates a business, and connects GBP; existing reviews backfill.
2. Staff adds 1 customer + imports a 50-row CSV with a clean error report.
3. A WhatsApp request sends, status reaches `delivered`, click is tracked on the redirect.
4. A new Google review appears in the feed within 15 minutes and gets an AI draft.
5. Owner edits and posts a reply; it appears on Google and `reply_status='posted'`.
6. A 1-star test review triggers a WhatsApp alert within 2 minutes; owner acknowledges it.
7. Plan limits enforce correctly; Stripe checkout activates a subscription; manual payment path works.
8. RLS negative test: user A cannot read user B's business data (verified by automated test).
9. Data export downloads complete; account deletion cascades and revokes tokens.

---

## 11. Traceability matrix (requirement → table/component)
| Requirement | Primary tables | Component |
|-------------|----------------|-----------|
| FR-AUTH-* | profiles, memberships | Supabase Auth, RLS |
| FR-BIZ-* | businesses, google_locations | Onboarding UI, OAuth, `poll-reviews` |
| FR-CUST-* | customers | Customers UI, CSV import |
| FR-REQ-* | review_requests, usage_counters | `send-message`, redirect endpoint |
| FR-MON-* | reviews | `poll-reviews`, dashboard |
| FR-AI-* | ai_drafts, reviews | `generate-draft`, `post-reply` |
| FR-ALERT-* | alerts | `send-alert`, `escalate-alerts` |
| FR-BILL-* | subscriptions, usage_counters, manual_payments | Stripe webhooks, admin |
| FR-SET-* | businesses, memberships, audit_log | Settings UI |
| FR-ADM-* | audit_log, manual_payments | Admin panel (service role) |
