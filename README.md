# Reputation Autopilot

> Turn happy customers into 5-star reviews — on autopilot.
> Collect more Google reviews over WhatsApp, reply with AI, and catch bad reviews instantly.

**Owner:** Muhammad Hassaan Khalid · **Stack:** Next.js 16 · React 19 · TypeScript · Tailwind v4 · Supabase

---

## Documentation

All product & engineering docs live in [`Docs/`](Docs/):

| Doc | Purpose |
|-----|---------|
| [PROJECT.md](Docs/PROJECT.md) | Vision, business model, roadmap |
| [PRD.md](Docs/PRD.md) | Product requirements, personas, KPIs, pricing |
| [SRS.md](Docs/SRS.md) | Software requirements, data model, RLS, acceptance criteria |
| [USER_FLOW.md](Docs/USER_FLOW.md) | End-to-end flows & journey maps |
| [ARCHITECTURE.md](Docs/ARCHITECTURE.md) | Clean architecture, layers, DI, SOLID, conventions |
| [DESIGN_SYSTEM.md](Docs/DESIGN_SYSTEM.md) | Tokens, typography, motion, components, a11y |

---

## Architecture at a glance

Clean Architecture with a **feature-first** layout. Dependencies point inward; the domain is
framework-free. See [ARCHITECTURE.md](Docs/ARCHITECTURE.md).

```
src/
├── app/            # Next.js routes (presentation entry): (marketing) (auth) (app) onboarding
├── core/           # config, DI container, Result<T,E>, errors  (framework-free)
├── shared/         # design system (ui/), patterns, hooks, lib, motion, providers
├── network/        # raw I/O: supabase clients, (google/whatsapp/claude/stripe adapters)
└── features/       # one folder per capability, each with:
        domain/         entities, value objects, repository PORTS
        application/    use cases (business logic)
        infrastructure/ repository ADAPTERS + mappers
        presentation/   components, server actions, screens
```

Each feature depends on **ports** (interfaces); the [DI composition root](src/core/di) binds them to
concrete adapters — so providers (WhatsApp↔Twilio, Google↔others) swap without touching business logic.

---

## Getting started

```bash
# 1. Install deps
npm install

# 2. Configure environment
cp .env.example .env.local        # fill in Supabase keys (see below)

# 3. (Optional) Spin up local Supabase + apply schema
supabase start
supabase db reset                  # applies supabase/migrations/*.sql (schema + RLS)

# 4. Run the app
npm run dev                        # http://localhost:3000
```

### Required environment variables
See [`.env.example`](.env.example). Minimum to boot the UI:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`.

---

## What's implemented

- ✅ **Design system** — tokens (light/dark), Button, Card, Input, Select, Badge, Avatar, Dropdown,
  RatingStars, Skeleton, Stepper, StatCard, EmptyState, PageHeader, Sparkline, toasts.
- ✅ **World-class landing page** — animated hero with product preview, features, how-it-works, pricing, CTA.
- ✅ **Auth** (full clean-arch slice) — email/password + Google OAuth, email verification, password reset,
  session middleware (`proxy.ts`), route guards. Domain → application → infrastructure → presentation.
- ✅ **Onboarding wizard** — premium multi-step (business → connect Google → done) with animated transitions.
- ✅ **App shell** — collapsible sidebar, top bar with business switcher + ⌘K search + user menu,
  mobile bottom-nav, theme toggle.
- ✅ **Dashboard** — activation checklist, animated stat cards, rating-trend sparkline, recent reviews.
- ✅ **App routes** — reviews, requests, customers, alerts, billing, settings (designed first-run states).
- ✅ **Supabase migrations** — full schema + RLS (deny-by-default, tenant isolation) in `supabase/migrations/`.

### Next up (data-layer wiring)
Reviews/customers/requests features (domain→infra→presentation), Google/WhatsApp/Claude/Stripe adapters,
Supabase Edge Functions (poll-reviews, send-message, generate-draft, send-alert) + Cron.

---

## Scripts
```bash
npm run dev      # dev server
npm run build    # production build
npm run start    # serve production build
npm run lint     # eslint
```
