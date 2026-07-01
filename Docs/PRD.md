# Product Requirements Document (PRD) — Reputation Autopilot

| Field | Value |
|-------|-------|
| **Product** | Reputation Autopilot |
| **Document type** | Product Requirements Document (PRD) |
| **Version** | 1.0 |
| **Status** | Approved for MVP build |
| **Owner** | Muhammad Hassaan Khalid |
| **Last updated** | 2026-06-25 |
| **Related docs** | [PROJECT.md](PROJECT.md) · [SRS.md](SRS.md) · [USER_FLOW.md](USER_FLOW.md) |

---

## 1. Overview

### 1.1 Product summary
Reputation Autopilot is a SaaS web application that automates the full Google review lifecycle for local
businesses: **collect** more reviews, **respond** to them with AI-generated drafts, and **catch** bad
reviews before they damage the business. The product targets non-technical local business owners
(restaurants, salons, clinics, gyms, repair shops) who understand the value of reviews but have no system
to manage them.

### 1.2 Vision statement
> Every local business deserves an enterprise-grade reputation team. Reputation Autopilot is that team —
> running 24/7, in the owner's pocket, for the price of a single staff lunch.

### 1.3 Problem recap
- Owners never **ask** happy customers → low review count.
- Owners **ignore** reviews → looks unprofessional, hurts ranking.
- A **1–2 star review** sits public for days before anyone notices.
- Owners have **no benchmark** against competitors.

### 1.4 Why now
- WhatsApp Cloud API is officially available and cheap in target markets.
- The Claude API makes high-quality, context-aware replies affordable (Haiku-tier pricing).
- Supabase + Vercel make a production SaaS shippable by a solo founder in weeks.

---

## 2. Goals & non-goals

### 2.1 Product goals (MVP)
1. Let a business owner connect their Google Business Profile in under 5 minutes.
2. Send a 1-click Google review request via WhatsApp/SMS in under 30 seconds per customer.
3. Surface every new review on a single dashboard within 15 minutes of it appearing.
4. Draft an AI reply for every review that the owner can post in one click.
5. Alert the owner on WhatsApp within 2 minutes of a 1–2 star review.

### 2.2 Business goals
- Onboard 10 free-trial businesses in the first month.
- Convert ≥ 40% of trials to paid.
- Reach ₨150,000 / ~$500 MRR within 3 months of launch.

### 2.3 Non-goals (explicitly out of scope for MVP)
- Review platforms other than Google (no Facebook, Yelp, TripAdvisor yet).
- Full competitor analytics suite (a basic competitor snapshot is a Pro stretch goal only).
- Native mobile apps (responsive web only).
- In-app team chat or CRM features.
- Automated reply **posting without owner approval** (owner always approves in MVP).
- Multi-language AI replies beyond English + Urdu/Hindi romanized.

---

## 3. Target users & personas

### 3.1 Primary persona — "Bilal, the Owner"
- Runs a 1–3 location restaurant/salon in Lahore or Mumbai.
- Age 28–45, uses WhatsApp daily, moderate English, prefers mobile.
- Pain: "Customers are happy but my Google rating is stuck at 4.1 with 30 reviews."
- Success: "My rating went to 4.6 with 120 reviews and I reply to everyone now."

### 3.2 Secondary persona — "Sana, the Staff/Manager"
- Front-desk or manager who actually adds customers and sends requests.
- Needs a dead-simple interface, minimal training.
- Permissions: can add customers, send requests, draft replies; **cannot** change billing.

### 3.3 Buyer = User
The owner is both the buyer and a daily user. Decisions are fast (post-demo yes/no). UI must
demo well in 3 minutes.

---

## 4. User stories (by epic)

### Epic A — Onboarding & business setup
- As an owner, I can sign up with email or Google so I can start fast.
- As an owner, I can create my business and connect my Google Business Profile so reviews flow in.
- As an owner, I can invite a staff member so they can run day-to-day work.

### Epic B — Review request engine
- As staff, I can add a customer manually (name + phone) so I can request a review.
- As staff, I can bulk-import customers via CSV so I can onboard existing customers.
- As staff, I can send a WhatsApp/SMS review request with a 1-click Google link.
- As an owner, I can see request status (sent / delivered / clicked / reviewed).
- As an owner, I am prevented from messaging the same customer too often (anti-spam guardrail).

### Epic C — Review monitoring
- As an owner, I can see all my Google reviews in one list, newest first.
- As an owner, I can filter by rating, replied/unreplied, and date.
- As an owner, I can see my rating trend and review volume over time.

### Epic D — AI replies
- As an owner, I get an AI-drafted reply for every review.
- As an owner, I can edit a draft and post it to Google in one click.
- As an owner, I can set a brand tone (friendly / formal / short) that shapes drafts.

### Epic E — Bad review alerts
- As an owner, I get an instant WhatsApp alert for any 1–2 star review.
- As an owner, I can acknowledge an alert so my team knows it's handled.

### Epic F — Billing & plans
- As an owner, I can start a free trial without a card.
- As an owner, I can upgrade to Starter/Pro and pay via Stripe (global) or manual/JazzCash (local).
- As an owner, I am told clearly when I hit a plan limit.

### Epic G — Settings & compliance
- As an owner, I can set business hours, tone, and notification preferences.
- As an owner, I can export my data and delete my account (compliance).

---

## 5. Functional requirements (feature detail)

### 5.1 Authentication & accounts
- Email/password and Google OAuth via **Supabase Auth**.
- Email verification required before sending messages.
- Roles: `owner`, `staff` (per-business, via membership table).
- Row-Level Security ensures a user only sees their own business data.

### 5.2 Business onboarding
- Create business: name, category, country, city, timezone, currency.
- Connect Google Business Profile via Google OAuth (Business Profile API scope).
- On connect: import existing reviews (backfill last 12 months) + store `location_id`.
- Support multiple locations per business (Pro plan).

### 5.3 Customer management
- Manual add: name (optional), phone (required, E.164 normalized), tags.
- CSV import: map columns, validate phone numbers, dedupe, report errors.
- Customer list with search, filter, last-request timestamp.
- Consent flag per customer (captured at point of collection).

### 5.4 Review request engine
- Channels: **WhatsApp Cloud API** (primary), **Twilio SMS** (fallback).
- Message uses an approved WhatsApp **template** with a 1-click short link.
- Short link → redirect to the Google "write a review" deep link for that location.
- Link carries a tracking token to attribute clicks back to the request.
- **Compliance:** every customer gets the same public review invite — **no sentiment gating**.
- Anti-spam: max 1 request per customer per 30 days; configurable quiet hours.
- Status lifecycle: `queued → sent → delivered → clicked → reviewed → failed`.

### 5.5 Review monitor
- Poll Google Business Profile API on a schedule (every 15 min) per connected location.
- Store new reviews; detect rating, text, author, time, and reply state.
- Dashboard widgets: average rating, total reviews, response rate, rating trend (sparkline),
  new-this-week count, unreplied count.
- Review feed with filters (rating, replied/unreplied, date range, location).

### 5.6 AI reply drafts
- On new review ingest, call **Claude API (Haiku)** to draft a reply.
- Prompt includes: review text, rating, business name, category, brand tone, language.
- Owner sees draft inline; can **Edit**, **Regenerate**, or **Post to Google**.
- Posting uses Google Business Profile API `reviews.updateReply`.
- Guardrails: never invent facts, never offer refunds/discounts unless tone allows, keep < 700 chars.

### 5.7 Bad review alerts
- Trigger when ingested review rating ≤ 2.
- Send WhatsApp alert to owner (template) with review snippet + deep link to dashboard.
- Alert record stored; owner can **Acknowledge**.
- Optional escalation: if unacknowledged in 1 hour, send a reminder (Pro).

### 5.8 Billing & plans
- Plans: **Trial** (14 days), **Starter**, **Pro** (see §7).
- Stripe Checkout + Customer Portal for global; manual/JazzCash flow for local
  (owner uploads proof → admin marks paid).
- Usage metering: review requests/month, locations, AI replies/month per plan.
- Hard limits with graceful upgrade prompts.

### 5.9 Settings & admin
- Business profile, brand tone, languages, quiet hours, notification channels.
- Team management (invite/remove staff).
- Data export (CSV/JSON) and account deletion (GDPR/Pakistan PDPB readiness).
- Internal admin panel (founder-only) for trials, manual payments, support.

---

## 6. Non-functional requirements (summary)
Full detail in [SRS.md §6](SRS.md). Highlights:
- **Performance:** dashboard loads < 2s on 3G; API p95 < 500ms.
- **Availability:** 99.5% monthly uptime target.
- **Security:** RLS on every table, secrets in vault, OAuth tokens encrypted at rest.
- **Scalability:** 1,000 businesses / 200k customers without re-architecture.
- **Compliance:** Google review-gating policy, WhatsApp template policy, data-privacy export/delete.
- **Localization:** English + Urdu/Hindi (romanized) UI strings; currency per region.

---

## 7. Pricing & packaging

| Plan | Local price | Global price | Locations | Review requests / mo | AI replies / mo | Bad-review alerts | Competitor view |
|------|-------------|--------------|-----------|----------------------|-----------------|-------------------|-----------------|
| **Trial** | Free (14 days) | Free (14 days) | 1 | 50 | 50 | ✅ | ❌ |
| **Starter** | ₨1,500 / mo | $29 / mo | 1 | 300 | Unlimited* | ✅ | ❌ |
| **Pro** | ₨4,000 / mo | $79 / mo | Up to 5 | 1,500 | Unlimited* | ✅ + escalation | ✅ (basic) |

\* "Unlimited" is fair-use capped to prevent abuse (soft cap, monitored).

**Add-ons (future):** extra locations, extra request volume, white-label.

---

## 8. Success metrics (KPIs)

| Category | Metric | Target (90 days post-launch) |
|----------|--------|------------------------------|
| Activation | % businesses that connect Google + send 1st request | ≥ 70% |
| Core value | New reviews generated / business / month | ≥ 15 |
| Engagement | Response rate (replies / reviews) | ≥ 80% |
| Speed | Median time-to-alert for bad reviews | ≤ 2 min |
| Retention | Monthly active businesses | ≥ 85% |
| Revenue | MRR | ₨150k / ~$500 |
| Conversion | Trial → paid | ≥ 40% |
| **North star** | **Total reviews generated for customers / month** | **growth MoM** |

---

## 9. Release plan & milestones

| Milestone | Scope | Timeline |
|-----------|-------|----------|
| **M1 — Foundation** | Scaffold, Supabase auth + schema + RLS, landing, onboarding, Google connect | Week 1 |
| **M2 — Requests** | Customers (manual + CSV), WhatsApp/SMS send, status tracking | Week 2 |
| **M3 — Monitor + AI** | Review polling, dashboard, AI drafts, bad-review alerts | Weeks 3–4 |
| **M4 — Monetize + Polish** | Plans + Stripe + manual pay, usage limits, settings, multi-location, deploy | Weeks 5–6 |
| **M5 — Beta hardening** | 10 trial businesses, bug-fix, performance, compliance review | Week 7 |

**Launch gate (must-pass before charging):** auth + RLS verified, Google connect stable,
requests deliver, reviews ingest, AI drafts post, bad-review alert fires, billing charges, data export works.

---

## 10. Dependencies & integrations

| Dependency | Purpose | Risk | Mitigation |
|------------|---------|------|------------|
| Supabase | DB, Auth, Storage, Edge Functions, Cron | Vendor lock-in | Standard Postgres; portable schema |
| Google Business Profile API | Reviews read + reply, review link | Quota / approval delay | Apply early; cache; backoff |
| WhatsApp Cloud API (Meta) | Requests + alerts | Template approval delay | Twilio SMS fallback at launch |
| Twilio | SMS fallback | Cost per segment | Use only as fallback |
| Claude API (Haiku) | AI reply drafts | Cost / latency | Cache, batch, Haiku tier |
| Stripe | Global billing | Not available locally | Manual/JazzCash path for local |
| Vercel | Hosting | — | Standard Next.js deploy |

---

## 11. Risks & mitigations
See [PROJECT.md §9](PROJECT.md). Top risks:
1. **WhatsApp template approval** → ship SMS fallback first, apply for WhatsApp day 1.
2. **Google review-gating compliance** → invite all customers publicly; never filter by sentiment.
3. **Google API quotas** → respect rate limits, exponential backoff, cache aggressively.
4. **AI reply quality/hallucination** → strict prompt guardrails, owner approval required.
5. **Local payments friction** → manual proof-upload flow until automated JazzCash integration.

---

## 12. Open questions
- [ ] First vertical to optimize copy/templates for (restaurants vs salons)?
- [ ] WhatsApp BSP: direct Meta Cloud API vs Twilio-hosted WhatsApp?
- [ ] Do we auto-post replies for 4–5 star reviews after a delay (opt-in)? (Post-MVP.)
- [ ] JazzCash API integration timeline vs manual-first?

---

## 13. Appendix — glossary
- **GBP** — Google Business Profile.
- **Review gating** — illegally filtering customers by sentiment before the public review link (prohibited).
- **Template** — pre-approved WhatsApp message format required for business-initiated messages.
- **RLS** — Row-Level Security (Postgres/Supabase access control).
- **MRR / ARPU** — Monthly Recurring Revenue / Average Revenue Per User.
