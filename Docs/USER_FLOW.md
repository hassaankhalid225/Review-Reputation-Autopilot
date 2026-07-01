# User Flow Document — Reputation Autopilot

| Field | Value |
|-------|-------|
| **Product** | Reputation Autopilot |
| **Document type** | User Flows & Journey Maps |
| **Version** | 1.0 |
| **Status** | Approved for MVP build |
| **Owner** | Muhammad Hassaan Khalid |
| **Last updated** | 2026-06-25 |
| **Related docs** | [PROJECT.md](PROJECT.md) · [PRD.md](PRD.md) · [SRS.md](SRS.md) |

> Notation: `→` next step · `[decision?]` branch · `⟳` background job · `✉️` outbound message ·
> 🟢 happy path · 🔴 error/edge path.

---

## 1. Personas in flows
- **Owner (Bilal):** signs up, connects Google, manages billing, approves replies, gets alerts.
- **Staff (Sana):** adds customers, sends requests, drafts replies (no billing).
- **Customer (end user):** receives WhatsApp/SMS, clicks link, writes Google review.
- **Platform admin (founder):** approves manual payments, supports trials.

---

## 2. Top-level site map

```
/                         Landing (marketing)
/login  /signup           Auth
/onboarding               Create business → Connect Google → Done
/app                      Dashboard (default after login)
/app/reviews              Review feed + AI replies
/app/requests             Review request engine + status
/app/customers            Customer list + CSV import
/app/alerts               Bad-review alerts
/app/settings             Business, tone, team, notifications
/app/billing              Plan, usage, upgrade, payment
/admin                    Founder admin (manual payments, trials)
/r/:token                 Public review redirect (click tracking)
```

---

## 3. End-to-end lifecycle (the big picture)

```
Sign up ─► Onboard business ─► Connect Google ─► Add customers
   │                                                  │
   │                                                  ▼
   │                                    Send review request ✉️ (WhatsApp/SMS)
   │                                                  │
   │                                    Customer clicks link /r/:token
   │                                                  │
   │                                    Customer writes Google review
   │                                                  ▼
   │                          ⟳ poll-reviews ingests new review (≤15 min)
   │                                                  │
   │                  ┌───────────── rating ≤ 2? ─────────────┐
   │                  ▼ yes                                   ▼ no
   │        ✉️ Bad-review alert to owner            ⟳ generate AI draft
   │                  │                                       │
   │           Owner acknowledges                  Owner edits/approves
   │                                                          ▼
   │                                            ✉️ Reply posted to Google
   ▼
Owner watches rating trend climb on Dashboard
```

---

## 4. Flow: Sign up & authentication

🟢 **Happy path**
1. Visitor lands on `/` → clicks **Start free trial**.
2. `/signup` → choose **Continue with Google** or email+password.
3. Supabase Auth creates `auth.users` + `profiles` row.
4. Email verification sent → user clicks link → verified.
5. Redirect to `/onboarding`.

🔴 **Edge cases**
- Email already exists → show "Log in instead" with prefilled email.
- Unverified user tries to send messages → blocked with "Verify your email first" banner.
- OAuth cancelled → return to `/signup` with non-blocking notice.
- Password reset → email link → set new password (rate-limited).

---

## 5. Flow: Business onboarding & Google connection

🟢 **Happy path**
1. `/onboarding` step 1 — **Business details**: name, category, country, city, timezone, currency → Save (`businesses` + `memberships(owner)`).
2. Step 2 — **Connect Google**: click **Connect Google Business Profile** → Google OAuth consent (GBP scope).
3. On return: pick the GBP **location(s)** to manage → store `google_locations` (encrypted refresh token, `review_link`).
4. ⟳ Backfill last 12 months of reviews into `reviews`.
5. Step 3 — **Done**: "You're set up!" → redirect to `/app` (Dashboard now shows real rating/reviews).

🔴 **Edge cases**
- Owner has no GBP / not a manager of the location → show help: "You must manage this profile in Google" + retry/skip.
- Google OAuth scope denied → explain why scope is needed, offer retry.
- Token expired/revoked later → Dashboard shows "Reconnect Google" banner; polling pauses for that location.
- Multiple locations but plan = Starter → allow 1, prompt upgrade to Pro for more.

---

## 6. Flow: Add customers (manual + CSV)

### 6.1 Manual add 🟢
1. `/app/customers` → **Add customer** → enter phone (required) + optional name/tags → Save.
2. Phone normalized to E.164; duplicate (same business+phone) → "Already exists" with link to record.

### 6.2 CSV import 🟢
1. **Import CSV** → upload file (to private `csv-imports` bucket).
2. **Map columns** (phone, name, tags) → Preview first rows.
3. Validate: bad phones flagged, duplicates marked, consent default applied.
4. **Confirm import** → valid rows inserted; **error report** lists skipped rows + reasons.

🔴 **Edge cases**
- Missing phone column → block import, explain required field.
- All rows invalid → show full error report, nothing imported.
- Large file → process in background, show progress + completion toast.

---

## 7. Flow: Send a review request

🟢 **Happy path**
1. `/app/requests` → select customer(s) → **Send review request**.
2. System checks: consent ✓, not messaged in last 30 days ✓, within quiet hours ✓, plan quota ✓.
3. Insert `review_requests(queued)` with idempotency key + `short_token`.
4. ⟳ `send-message` Edge Function → **WhatsApp** template ✉️ (with `/r/:token` link). SMS fallback if WhatsApp unavailable.
5. Status → `sent` → (webhook) `delivered`.
6. Customer taps link → `/r/:token` records `clicked_at` → 302 redirect to Google **write-review** page.
7. Customer submits review → later ⟳ poll detects it → status → `reviewed`.

🔴 **Edge cases / guardrails**
- Customer messaged < 30 days ago → blocked: "Recently contacted" (anti-spam).
- Quiet hours active → queued and auto-sent when window opens (business timezone).
- Plan quota exceeded → block + **Upgrade** prompt; over-limit sends not allowed.
- Provider send fails → status `failed` + error; retry with backoff; SMS fallback.
- No consent → excluded from selection with reason.
- **Compliance:** ALL selected customers get the same public invite — no "are you happy?" pre-filter.

```
[select customers] → [guardrail checks?] ──fail──► show reason, skip
        │ pass
        ▼
  insert request(queued) → ⟳ send ✉️ → sent → delivered → clicked → reviewed
                                   └─fail─► failed → retry/backoff → SMS fallback
```

---

## 8. Flow: Review monitoring & dashboard

🟢 **Happy path**
1. ⟳ Cron runs `poll-reviews` every 15 min per connected location.
2. New/edited reviews upserted into `reviews` (idempotent by Google review id).
3. Dashboard (`/app`) shows: avg rating, total reviews, response rate, new-this-week, unreplied count, rating trend sparkline.
4. Supabase Realtime pushes new reviews to the open dashboard (live badge).
5. `/app/reviews` feed: filter by rating / replied-unreplied / date / location.

🔴 **Edge cases**
- Google token error → "Reconnect Google" banner; show last-synced time.
- Review deleted on Google → mark accordingly, exclude from counts.
- No reviews yet → empty state with "Send your first request" CTA.

---

## 9. Flow: AI reply draft & post to Google

🟢 **Happy path**
1. On ingest, ⟳ `generate-draft` calls Claude (Haiku) with review + rating + business + brand tone + language.
2. Draft stored in `ai_drafts`; review `reply_status='drafted'`.
3. Owner opens review → sees draft inline → **Edit** / **Regenerate** / **Post to Google**.
4. **Post** → ⟳ `post-reply` → GBP `updateReply` → `reply_status='posted'`, reply visible on Google.

🔴 **Edge cases**
- Owner edits then posts → store final text + mark draft `edited`.
- Regenerate → new draft (optionally with a tone nudge).
- Post fails (token/permission) → `reply_status='failed'`, retry + reconnect prompt.
- Guardrails: draft ≤ 700 chars, no invented facts, no unauthorized refunds/discounts.

```
new review ─► ⟳ generate draft ─► [owner reviews]
                                     ├─ Edit ──┐
                                     ├─ Regenerate ─► new draft
                                     └─ Post ──► ⟳ updateReply ─► posted ✓
                                                          └─fail─► retry/reconnect
```

---

## 10. Flow: Bad-review alert

🟢 **Happy path**
1. ⟳ Poll ingests a review with rating ≤ 2.
2. Create `alerts(bad_review)` → ⟳ `send-alert` ✉️ WhatsApp to owner within 2 min (rating + snippet + dashboard deep link).
3. Owner taps link → `/app/alerts` (or the review) → reviews context → **Acknowledge** (`acknowledged_at`, `acknowledged_by`).
4. Owner drafts/edits an empathetic reply (AI-assisted) and posts.

🔴 **Edge cases / escalation**
- Owner WhatsApp undeliverable → SMS/email fallback.
- Unacknowledged > 1 hour (Pro) → ⟳ `escalate-alerts` sends reminder.
- Multiple bad reviews → grouped in `/app/alerts`, each acknowledgeable.

---

## 11. Flow: Billing, plans & usage

### 11.1 Trial → paid (global / Stripe) 🟢
1. New business starts on **Trial** (14 days, limits applied), no card.
2. Approaching trial end or hitting a limit → `/app/billing` prompt.
3. **Upgrade** → Stripe Checkout → success webhook → `subscriptions(active)` + limits raised.
4. Manage via Stripe Customer Portal (upgrade/downgrade/cancel).

### 11.2 Local payment (manual / JazzCash) 🟢
1. `/app/billing` → choose plan → **Pay manually** → instructions + amount.
2. Owner uploads payment proof (to `payment-proofs`) → `manual_payments(pending)` + `subscriptions(manual_pending)`.
3. ⟳ Founder reviews in `/admin` → **Approve** → `subscriptions(active)`; or **Reject** with reason.

🔴 **Edge cases**
- Trial expired, not upgraded → read-only/limited mode; sends blocked, data retained.
- Stripe payment failed → `past_due` + grace period (dunning) → suspend if unresolved.
- Manual proof rejected → notify owner, allow re-upload.
- Limit reached mid-action → block with clear "Upgrade to continue" message.

---

## 12. Flow: Settings, team & compliance

🟢 **Settings**
1. `/app/settings` → edit business profile, **brand tone** (friendly/formal/short), languages, **quiet hours**, notification channels.
2. **Team**: invite staff by email → they accept → `memberships(staff)`; owner can remove.

🟢 **Compliance**
- **Export data** → generate CSV/JSON of business data → download link.
- **Delete account** → confirm → cascade delete + revoke Google/WhatsApp tokens → goodbye screen.
- Customer **STOP/opt-out** (SMS) → set consent=false → excluded from future sends.

🔴 **Edge cases**
- Staff tries to open `/app/billing` → access denied (owner-only).
- Last owner tries to leave business → must transfer ownership or delete business.

---

## 13. Flow: Platform admin (founder)

🟢 **Happy path**
1. `/admin` (service-role gated) → list `manual_payments(pending)`.
2. Open one → view proof → **Approve**/**Reject** → updates subscription → logged in `audit_log`.
3. Manage trials (extend), view businesses, basic support actions.

🔴 All cross-tenant access logged; admin cannot silently read tenant PII without an audit entry.

---

## 14. Mobile-first interaction notes
- Core actions reachable in ≤ 3 taps from `/app`: **Send request**, **Reply to review**, **Acknowledge alert**.
- Bottom nav (mobile): Dashboard · Reviews · Requests · Alerts · More.
- Bilingual UI (English / Urdu-Hindi romanized) toggle in settings.
- Every list has loading, empty, and error states.

---

## 15. Cross-cutting error & empty states
| Situation | UX |
|-----------|----|
| Google disconnected | Persistent "Reconnect Google" banner; polling paused |
| No reviews yet | Empty state + "Send your first request" CTA |
| No customers yet | Empty state + "Add" / "Import CSV" CTA |
| Quota reached | Inline block + "Upgrade" CTA |
| Send/post failed | Toast + retry; status reflects `failed` |
| Trial expired | Limited mode banner + upgrade path |
| Network error | Retry affordance; never lose unsaved draft |

---

## 16. Activation checklist (first-run success)
A business is **activated** when it has:
1. ✅ Connected Google Business Profile.
2. ✅ Added/imported at least 1 customer.
3. ✅ Sent at least 1 review request.
4. ✅ Posted at least 1 AI-assisted reply.

The onboarding UI nudges toward these four with a progress checklist on the Dashboard.
