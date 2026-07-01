# Reputation Autopilot — Project Documentation

> **Review/Reputation Autopilot** — A SaaS that helps local businesses (restaurants, salons,
> clinics, gyms, repair shops) collect more Google reviews, respond to them with AI, and
> catch bad reviews before they hurt the business.

- **Status:** Planning / Pre-MVP
- **Owner:** Muhammad Hassaan Khalid
- **Last updated:** 2026-06-25

---

## 1. The Problem

Local businesses live and die by their Google reviews, but most owners have no system to manage them:

- They never **ask** happy customers for reviews → low review count.
- They **ignore** reviews → no replies, looks unprofessional.
- A **bad review (1–2 star)** sits public for days before they even notice → real damage.
- They have **no idea** how they compare to competitors.

The owner clearly understands the value ("more reviews = more customers"), so this is **easy to sell**
and the pain is **recurring** → recurring revenue.

---

## 2. The Solution

A simple dashboard + automation that runs the full review lifecycle:

1. **Review request engine** — Owner adds a customer's number (manual / CSV / POS import).
   An automated WhatsApp/SMS goes out with a **1-click Google review link**.
2. **Review monitor** — Pulls new reviews from Google Business Profile and shows them on a dashboard.
3. **AI reply drafts** — Every review gets a professional reply draft via the Claude API;
   owner approves/edits with one click.
4. **Bad review alert** — A 1–2 star review triggers an **instant WhatsApp alert** to the owner
   for fast damage control.
5. **Dashboard** — Rating trend, total reviews, response rate, (later) competitor comparison.

> These 5 features = a product people will pay for. Everything else is a later add-on.

---

## 3. Target Market

- **Phase 1 — Pakistan / India local businesses.**
  - Less competition, WhatsApp-heavy culture, face-to-face / WhatsApp sales.
  - Fast cash flow; owner can say yes after a quick demo.
- **Phase 2 — Global (US / Europe).**
  - Same codebase; add Stripe + English-first onboarding.
  - Funded competitors exist here (Birdeye, Podium), so win locally first.

**Ideal first customers:** restaurants, salons/barbers, dental & beauty clinics, gyms, car/phone repair shops.

---

## 4. Business Model

| Plan | Price (local) | Includes |
|------|---------------|----------|
| Starter | ~₨1,500 / PKR-INR per month | 1 location, review requests, basic dashboard |
| Pro | ~₨4,000 per month | Multi-location, unlimited AI replies, bad-review alerts, competitor view |

- **Global pricing:** equivalent in USD via Stripe (e.g. $29 / $79).
- **Go-to-market:** Give 10 local businesses a **free 1-month trial** → screenshot their results
  → use as proof to sell the rest.
- **Moat / lock-in:** The more reviews and history flow through the system, the harder it is for
  the owner to leave (their data + daily workflow live here).

---

## 5. Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Next.js + Tailwind + shadcn/ui | Fast UI, single repo for API too |
| Backend | Next.js API routes / tRPC | Monolith is best for MVP speed |
| Database | Postgres (Supabase or Neon) | Free tier, generous, SQL |
| Auth | Supabase Auth / Clerk | Don't build auth yourself |
| WhatsApp | Meta WhatsApp Cloud API (Twilio for SMS fallback) | Official, scalable |
| Reviews | Google Business Profile API | Core data source |
| AI | Claude API (Haiku for cheap reply drafts) | Reply generation |
| Payments | Stripe (global) + JazzCash/manual (local) | Regional reality |
| Deploy | Vercel + Supabase | Near-zero DevOps to start |

---

## 6. Data Model (initial sketch)

- **users** — auth account (owner / staff).
- **businesses** — name, Google Business Profile ID, location, plan, owner_id.
- **customers** — name, phone, business_id, last_visit, review_request_sent_at.
- **review_requests** — customer_id, channel (whatsapp/sms), status (sent/clicked/reviewed), sent_at.
- **reviews** — business_id, source (google), rating, text, author, reply_text, reply_status, created_at.
- **alerts** — business_id, review_id, type (bad_review), sent_at, acknowledged.
- **subscriptions** — business_id, plan, status, current_period_end (Stripe).

---

## 7. MVP Roadmap (4–6 weeks)

### Milestone 1 — Foundation (Week 1)
- [ ] Project scaffold (Next.js + Tailwind + shadcn/ui)
- [ ] Supabase setup: DB schema + auth
- [ ] Landing page + sign up / login
- [ ] Business onboarding (connect Google Business Profile)

### Milestone 2 — Review Requests (Week 2)
- [ ] Add customer (manual + CSV import)
- [ ] WhatsApp/SMS send with 1-click review link
- [ ] Track request status (sent / clicked / reviewed)

### Milestone 3 — Review Monitor + AI (Weeks 3–4)
- [ ] Pull reviews from Google Business Profile
- [ ] Dashboard: list reviews, rating trend, response rate
- [ ] Claude AI reply drafts (approve / edit / post)
- [ ] Bad-review (1–2 star) instant WhatsApp alert

### Milestone 4 — Monetization + Polish (Weeks 5–6)
- [ ] Plans + Stripe (and local payment path)
- [ ] Usage limits per plan
- [ ] Settings, multi-location (Pro)
- [ ] Deploy to production (Vercel + Supabase)

---

## 8. Success Metrics

- **Activation:** business connects Google profile + sends first review request.
- **Core value:** # of new reviews generated per business per month.
- **Retention:** monthly active businesses; churn rate.
- **Revenue:** MRR, paying businesses, ARPU.
- **North star:** total reviews generated for customers per month.

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| WhatsApp API approval / templates | Start with SMS (Twilio) fallback; apply for WhatsApp early |
| Google API limits / review-gating policy | Follow Google policy: ask all customers, never filter by sentiment before the public link |
| Funded global competitors | Win local market first where they're weak |
| Owner churn after trial | Show concrete review-count results during trial |

> **Compliance note:** Google's policy forbids "review gating" (only routing happy customers to
> public reviews). The request flow must invite **all** customers to review publicly.

---

## 10. Open Questions / Next Steps

- [ ] Confirm stack (Supabase + Next.js) and start scaffold.
- [ ] Decide first vertical to target (e.g. restaurants vs salons).
- [ ] Get WhatsApp Cloud API access / Twilio account.
- [ ] Line up 3–5 local businesses for the first trial.
