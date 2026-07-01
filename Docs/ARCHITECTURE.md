# Architecture — Reputation Autopilot

| Field | Value |
|-------|-------|
| **Product** | Reputation Autopilot |
| **Document type** | Software Architecture & Engineering Standards |
| **Version** | 1.0 |
| **Owner** | Muhammad Hassaan Khalid |
| **Last updated** | 2026-06-25 |
| **Related docs** | [PRD.md](PRD.md) · [SRS.md](SRS.md) · [USER_FLOW.md](USER_FLOW.md) · [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) |

> This document is the engineering contract. Every feature MUST follow the layering, boundaries,
> and conventions defined here. The goal: a **modular, scalable, enterprise-grade** codebase where any
> feature can be added, changed, tested, or removed **without breaking the rest**.

---

## 1. Principles

1. **Clean Architecture** — dependencies point inward. Domain knows nothing about frameworks.
2. **Feature-first modularity** — code is grouped by business capability, not by technical type.
3. **Strict layer separation** — Presentation · Application · Domain · Infrastructure · Network.
4. **SOLID** — small focused units, depend on abstractions, open for extension.
5. **Dependency Injection** — features receive their dependencies; nothing reaches into globals.
6. **Type-safe end-to-end** — TypeScript strict mode; DB types generated from Supabase.
7. **Server-first** — React Server Components by default; client components only when interactive.
8. **Fail explicitly** — `Result<T, E>` for expected failures; thrown errors only for bugs.
9. **Testable by construction** — pure domain/use-cases; infrastructure behind interfaces.

---

## 2. The layers

```
┌──────────────────────────────────────────────────────────────────────┐
│  PRESENTATION  (React Server/Client Components, screens, UI state)     │  ← Next.js App Router
│     depends on ↓ application (via DI), shared/ui                       │
├──────────────────────────────────────────────────────────────────────┤
│  APPLICATION   (use cases / services — orchestrates domain + repos)    │  ← business logic
│     depends on ↓ domain (interfaces only)                              │
├──────────────────────────────────────────────────────────────────────┤
│  DOMAIN        (entities, value objects, repo interfaces, policies)    │  ← pure, framework-free
│     depends on → nothing (innermost)                                   │
├──────────────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE (repository impls, mappers, external adapters)         │  ← implements domain ports
│     depends on ↓ network, domain                                       │
├──────────────────────────────────────────────────────────────────────┤
│  NETWORK       (Supabase client, HTTP clients for Google/WA/Claude)    │  ← raw I/O, no business rules
└──────────────────────────────────────────────────────────────────────┘
```

**The dependency rule:** source code dependencies only point *inward* (toward Domain).
Domain never imports from Application/Infrastructure/Presentation. Infrastructure implements
interfaces *declared in* Domain (Dependency Inversion).

### 2.1 Layer responsibilities

| Layer | Owns | MUST NOT |
|-------|------|----------|
| **Domain** | Entities, value objects, repository **interfaces** (ports), domain policies/guards, domain errors | Import React, Supabase, fetch, env, or any framework |
| **Application** | Use cases (one class/function per user intention), DTOs, orchestration, transactions | Touch the DOM, render UI, or talk to HTTP/DB directly |
| **Infrastructure** | Repository **implementations**, data mappers (DB row ⇄ entity), external service adapters | Contain business rules; leak DB types upward |
| **Network** | Supabase clients (browser/server/service), HTTP wrappers, retry/backoff, signing | Know about entities or use cases |
| **Presentation** | Screens, components, view-models/hooks, form handling, routing | Contain business rules or call the network directly |

---

## 3. Folder structure

```
src/
├── app/                                # Next.js App Router (presentation entry only)
│   ├── (marketing)/                    # landing, pricing, legal — public
│   ├── (auth)/                         # login, signup, reset
│   ├── (app)/                          # authenticated shell: dashboard, reviews, ...
│   ├── (admin)/                        # founder admin
│   ├── api/                            # route handlers (webhooks, redirect /r/[token])
│   ├── layout.tsx                      # root layout (providers)
│   └── globals.css                     # design tokens + Tailwind layer
│
├── core/                               # cross-cutting framework-agnostic foundation
│   ├── config/                         # env schema (zod), feature flags, constants
│   ├── di/                             # composition root — wires interfaces → impls
│   ├── result/                         # Result<T,E>, ok(), err(), guards
│   ├── errors/                         # AppError hierarchy, error codes
│   ├── logger/                         # structured logging abstraction
│   └── types/                          # shared primitive types, branded types
│
├── shared/                             # reusable, feature-agnostic building blocks
│   ├── ui/                             # DESIGN SYSTEM — primitives (Button, Card, Input…)
│   ├── ui/patterns/                    # composed patterns (DataTable, EmptyState, PageHeader…)
│   ├── hooks/                          # generic hooks (useMediaQuery, useDebounce…)
│   ├── lib/                            # cn(), formatters, date/phone/currency utils
│   ├── motion/                         # animation variants, transitions, springs
│   └── providers/                      # ThemeProvider, QueryProvider, ToastProvider
│
├── network/                            # raw I/O clients (no business logic)
│   ├── supabase/                       # browser.ts, server.ts, service.ts, middleware.ts
│   ├── google/                         # GBP HTTP client + OAuth
│   ├── whatsapp/                       # WhatsApp Cloud client
│   ├── twilio/                         # SMS client
│   ├── claude/                         # Anthropic client
│   └── http/                           # fetch wrapper: retry, backoff, idempotency
│
└── features/                           # ← THE PRODUCT, one folder per capability
    ├── auth/
    │   ├── domain/                     # User, Session entities; AuthRepository (port); errors
    │   ├── application/                # SignInUseCase, SignUpUseCase, SignOutUseCase…
    │   ├── infrastructure/             # SupabaseAuthRepository (implements port) + mappers
    │   └── presentation/               # SignInForm, screens, useAuth hook, server actions
    ├── businesses/
    ├── customers/
    ├── review-requests/
    ├── reviews/
    ├── ai-replies/
    ├── alerts/
    ├── billing/
    ├── settings/
    └── dashboard/
```

**Rule of thumb:** if it's specific to one capability → it lives in `features/<x>/`. If three or
more features need it → promote to `shared/` or `core/`. Never the reverse.

---

## 4. Anatomy of a feature (the template every feature copies)

Using `customers` as the canonical example.

```
features/customers/
├── domain/
│   ├── customer.entity.ts          # Customer entity + invariants (valid phone, consent)
│   ├── phone.vo.ts                 # PhoneNumber value object (E.164 normalize/validate)
│   ├── customer.repository.ts      # interface CustomerRepository { … }  ← PORT
│   └── customer.errors.ts          # DuplicateCustomerError, InvalidPhoneError…
│
├── application/
│   ├── dto/                        # AddCustomerInput, CustomerView (presentation-safe shapes)
│   ├── add-customer.usecase.ts     # orchestrates: validate → dedupe → repo.save
│   ├── import-customers.usecase.ts # CSV parse → validate rows → bulk save → report
│   └── list-customers.usecase.ts
│
├── infrastructure/
│   ├── customer.mapper.ts          # DB row ⇄ Customer entity
│   └── supabase-customer.repository.ts  # implements CustomerRepository via network/supabase
│
└── presentation/
    ├── actions.ts                  # 'use server' actions → resolve usecase from DI → call
    ├── components/                 # CustomerTable, AddCustomerDialog, CsvImportWizard
    ├── hooks/                      # useCustomers (TanStack Query), useCustomerFilters
    └── screens/                    # CustomersScreen (composed)
```

### 4.1 Example: the port (domain) and its impl (infrastructure)

```ts
// features/customers/domain/customer.repository.ts  — PORT (no framework imports)
export interface CustomerRepository {
  findByPhone(businessId: string, phone: PhoneNumber): Promise<Customer | null>;
  save(customer: Customer): Promise<Result<Customer, AppError>>;
  list(query: ListCustomersQuery): Promise<Paginated<Customer>>;
}
```

```ts
// features/customers/infrastructure/supabase-customer.repository.ts — ADAPTER
export class SupabaseCustomerRepository implements CustomerRepository {
  constructor(private readonly db: SupabaseClient) {}      // injected
  async save(customer: Customer) { /* map → upsert → map back → Result */ }
  // …
}
```

### 4.2 Example: a use case (application)

```ts
// features/customers/application/add-customer.usecase.ts
export class AddCustomerUseCase {
  constructor(private readonly repo: CustomerRepository) {}   // depends on PORT, not impl

  async execute(input: AddCustomerInput): Promise<Result<CustomerView, AppError>> {
    const phone = PhoneNumber.create(input.phone);            // value object validates
    if (phone.isErr()) return err(phone.error);
    const existing = await this.repo.findByPhone(input.businessId, phone.value);
    if (existing) return err(new DuplicateCustomerError());
    const customer = Customer.create({ ...input, phone: phone.value });
    return this.repo.save(customer);
  }
}
```

### 4.3 Example: presentation wires through DI, never `new`s infrastructure

```ts
// features/customers/presentation/actions.ts
'use server';
export async function addCustomerAction(raw: unknown) {
  const input = AddCustomerInput.parse(raw);                 // zod at the boundary
  const usecase = container.resolve('AddCustomerUseCase');   // DI
  const result = await usecase.execute(input);
  return result.match({ ok: toActionOk, err: toActionError });
}
```

---

## 5. Dependency Injection (composition root)

- A single **composition root** in `core/di/` wires interfaces to implementations.
- Lightweight token-based container (no heavyweight framework) — typed `resolve<T>(token)`.
- Two scopes: **server** (per-request, uses request-scoped Supabase server client) and
  **edge/service** (uses service-role client, no user session).
- Presentation/use cases **always** depend on the interface token, never construct adapters.
- This makes every layer swappable in tests (inject a fake repository) and at runtime
  (e.g. swap WhatsApp adapter for Twilio behind the same `MessageSender` port).

```ts
// core/di/container.ts (sketch)
register('CustomerRepository', (ctx) => new SupabaseCustomerRepository(ctx.db));
register('AddCustomerUseCase', (ctx) => new AddCustomerUseCase(resolve('CustomerRepository', ctx)));
```

---

## 6. Cross-cutting contracts

### 6.1 Result & errors
- `Result<T, E>` (`core/result`) for **expected** outcomes (validation, not-found, quota).
- `AppError` hierarchy (`core/errors`) with stable `code`, `httpStatus`, and user-safe `message`.
- Thrown exceptions reserved for **programmer errors** / truly exceptional infra failures.
- Presentation maps `AppError.code` → localized toast/inline message.

### 6.2 Validation
- **Zod** schemas at every boundary: server action inputs, route handlers, env, external payloads.
- Domain value objects (PhoneNumber, Email, Rating) enforce invariants beyond shape.

### 6.3 Config
- `core/config/env.ts` parses `process.env` through a zod schema at startup; fail fast if missing.
- No raw `process.env` access anywhere else.

### 6.4 Ports for external services (Dependency Inversion in action)
| Port (domain/shared) | Default adapter | Swappable with |
|----------------------|-----------------|----------------|
| `MessageSender` | `WhatsAppSender` | `TwilioSmsSender` (fallback), fakes in tests |
| `ReviewProvider` | `GoogleReviewProvider` | future: Facebook/Yelp |
| `ReplyDrafter` | `ClaudeReplyDrafter` | any LLM |
| `PaymentGateway` | `StripeGateway` | `ManualPaymentGateway` (local) |
| `AuthRepository` | `SupabaseAuthRepository` | Clerk (if ever) |

Because consumers depend on the port, adding WhatsApp→SMS fallback or a new review source is an
**infrastructure-only change** — application and presentation are untouched.

---

## 7. State management strategy

| Kind of state | Tool | Where |
|---------------|------|-------|
| Server data (reviews, customers…) | **TanStack Query** | presentation/hooks; cached, deduped, background-refetch |
| Server mutations | **Server Actions** → use cases | presentation/actions.ts |
| Global UI state (active business, theme, command palette) | **Zustand** | shared/providers + feature stores |
| Form state | **react-hook-form + zod** | feature forms |
| Realtime (new reviews/alerts) | **Supabase Realtime** → invalidate queries | feature hooks |

Principle: **server state ≠ client state.** Don't put fetched data in Zustand; let Query own it.

---

## 8. Rendering & data flow

- **Server Components** fetch via use cases (through DI) and stream HTML — fast first paint.
- **Client Components** only for interactivity; hydrate with TanStack Query using server-prefetched data.
- **Mutations** go through Server Actions → use case → repository; on success, revalidate/`invalidateQueries`.
- **Webhooks & cron** live in `app/api/**` and Supabase Edge Functions; both resolve use cases from the
  service-scoped DI container (service-role client) so business logic is shared, not duplicated.

---

## 9. Performance architecture
- RSC + streaming + `Suspense` boundaries per section → perceived instant loads.
- Route-level code-splitting; client bundles kept lean (server-first).
- TanStack Query caching + `staleTime` tuned per resource; optimistic updates for snappy UX.
- Image optimization via `next/image`; fonts via `next/font` (no layout shift).
- Skeleton loaders for every async region (see [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)).
- DB: indexed queries (SRS §5.5), pagination everywhere, `count` only when needed.
- Animations on the compositor (transform/opacity) for 60fps; respect `prefers-reduced-motion`.
- Offline-tolerant: Query cache + ret ry/backoff in `network/http`; mutations queued where safe.

---

## 10. Security architecture
- RLS is the **last line** of defense; use cases also authorize (defense in depth).
- Service-role client used **only** in server/edge contexts via the service-scoped DI; never shipped to client.
- Secrets validated in `core/config`; never imported into client components.
- All external webhooks signature-verified in `network/**` adapters before reaching use cases.
- Audit-worthy use cases emit `audit_log` events via an `AuditLogger` port.

---

## 11. Testing strategy
| Level | Target | Tooling |
|-------|--------|---------|
| Unit | Domain entities, value objects, use cases (with fake repos) | Vitest |
| Integration | Repositories against a test Supabase / pgTAP for RLS | Vitest + Supabase local |
| Component | UI primitives & patterns | Testing Library |
| E2E | Critical flows (signup→onboard→send→reply) | Playwright |
| RLS | Negative tenant-isolation tests | pgTAP / SQL tests |

Because domain/application are pure and depend on ports, **90% of business logic is unit-testable
with zero infrastructure**.

---

## 12. Coding standards & conventions
- **TypeScript strict**; no `any` (use `unknown` + narrowing). `noUncheckedIndexedAccess` on.
- **Files:** `kebab-case.ts`; **classes/types:** `PascalCase`; **functions/vars:** `camelCase`;
  **components:** `PascalCase.tsx`; **constants:** `SCREAMING_SNAKE`.
- **Naming by role:** `*.entity.ts`, `*.vo.ts`, `*.repository.ts` (port), `supabase-*.repository.ts`
  (adapter), `*.usecase.ts`, `*.mapper.ts`, `*.dto.ts`, `*.actions.ts`, `*.screen.tsx`.
- **Imports:** absolute via `@/*`; enforce layer boundaries with ESLint `import/no-restricted-paths`
  (domain may not import infrastructure/presentation, etc.).
- **One public reason to change per module** (SRP). Functions small; early returns; no deep nesting.
- **No business logic in components**; no I/O in domain; no `new Adapter()` outside DI.
- **Comments** explain *why*, not *what*. Public ports/use cases get a short doc comment.
- **Conventional Commits**; PRs small and feature-scoped.

### 12.1 ESLint boundary rules (enforced, not just documented)
```
domain/          → may import: domain only
application/      → may import: domain
infrastructure/  → may import: domain, network, core
presentation/    → may import: application(dto/usecase via DI), shared, core
network/         → may import: core
```

---

## 13. Tech stack (locked)
| Concern | Choice |
|---------|--------|
| Framework | Next.js 16 (App Router, RSC) + React 19 |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + design tokens (CSS vars) |
| UI primitives | Radix UI + custom design system (shadcn-style, owned in `shared/ui`) |
| Animation | Motion (Framer Motion) |
| Icons | lucide-react |
| Server state | TanStack Query |
| Client state | Zustand |
| Forms/validation | react-hook-form + Zod |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions, Cron, Realtime) |
| External | Google GBP, WhatsApp Cloud, Twilio, Claude API, Stripe |
| Hosting | Vercel + Supabase |
| Notifications | Sonner (toasts) |
| Testing | Vitest, Testing Library, Playwright, pgTAP |

---

## 14. Why this architecture meets the goals
- **Add a feature** → create a new `features/<x>/` folder following §4; wire ports in DI. Nothing else changes.
- **Change a provider** (WhatsApp→Twilio, Google→Yelp) → new adapter behind the same port. Use cases untouched.
- **Test confidently** → pure domain + injected fakes; RLS verified by SQL tests.
- **Scale the team** → features are independent; clear boundaries prevent merge collisions.
- **Stay fast** → server-first rendering, query caching, compositor animations.
- **Premium UX** → all UI flows compose the single design system (see [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)).
