# Design System — Reputation Autopilot

| Field | Value |
|-------|-------|
| **Product** | Reputation Autopilot |
| **Document type** | Design System & UX Standards |
| **Version** | 1.0 |
| **Owner** | Muhammad Hassaan Khalid |
| **Last updated** | 2026-06-25 |
| **Related docs** | [ARCHITECTURE.md](ARCHITECTURE.md) · [USER_FLOW.md](USER_FLOW.md) · [PRD.md](PRD.md) |

> Target: a **premium, Apple-grade** product. Calm, confident, fast. Every pixel intentional,
> every interaction smooth, every state designed. Inspiration: **Apple · Linear · Stripe · Notion ·
> Arc · Airbnb.** Implemented as code in `src/shared/ui` and `src/app/globals.css`.

---

## 1. Design principles
1. **Clarity over decoration** — content first; chrome recedes.
2. **Calm confidence** — generous whitespace, soft depth, restrained color.
3. **Motion with meaning** — animation explains change, never distracts (150–250ms, spring easing).
4. **One primary action per screen** — obvious next step; reduce choices and clicks.
5. **Always responsive feedback** — every tap acknowledges within 100ms (optimistic + skeletons).
6. **Designed states** — loading, empty, error, success are first-class, never afterthoughts.
7. **Accessible by default** — WCAG 2.1 AA contrast, focus-visible rings, keyboard-complete, reduced-motion.
8. **Consistency is the brand** — same spacing, radii, shadows, and timing everywhere.

---

## 2. Color system (tokens via CSS variables, light + dark)

Semantic tokens — components reference roles, never raw hex. Defined in `globals.css` and exposed to
Tailwind v4 via `@theme`.

```css
:root {
  /* Brand — deep indigo→violet, premium and trustworthy */
  --brand-50:  #eef2ff;  --brand-100: #e0e7ff; --brand-200: #c7d2fe;
  --brand-300: #a5b4fc;  --brand-400: #818cf8; --brand-500: #6366f1;
  --brand-600: #4f46e5;  --brand-700: #4338ca; --brand-800: #3730a3; --brand-900: #312e81;

  /* Neutrals — true-gray scale for surfaces & text */
  --gray-0:#ffffff; --gray-50:#fafafa; --gray-100:#f5f5f5; --gray-200:#e5e5e5;
  --gray-300:#d4d4d4; --gray-400:#a3a3a3; --gray-500:#737373; --gray-600:#525252;
  --gray-700:#404040; --gray-800:#262626; --gray-900:#171717; --gray-950:#0a0a0a;

  /* Semantic surfaces */
  --background: var(--gray-50);
  --surface:    var(--gray-0);     /* cards */
  --surface-2:  var(--gray-100);   /* insets */
  --border:     var(--gray-200);
  --ring:       var(--brand-500);

  /* Text */
  --text-primary:   var(--gray-900);
  --text-secondary: var(--gray-600);
  --text-tertiary:  var(--gray-400);
  --text-on-brand:  #ffffff;

  /* Accents (semantic) */
  --success:#10b981; --success-bg:#ecfdf5;
  --warning:#f59e0b; --warning-bg:#fffbeb;
  --danger:#ef4444;  --danger-bg:#fef2f2;
  --info:#3b82f6;    --info-bg:#eff6ff;

  /* Rating (review stars) */
  --star: #f5a623;
}

.dark {
  --background: var(--gray-950);
  --surface:    #111113;
  --surface-2:  #18181b;
  --border:     #27272a;
  --text-primary:   #fafafa;
  --text-secondary: #a1a1aa;
  --text-tertiary:  #71717a;
  --success-bg:#052e23; --warning-bg:#2a1f05; --danger-bg:#2a0a0a; --info-bg:#0a1a2a;
}
```

- **Contrast:** body text ≥ 4.5:1, large text/icons ≥ 3:1. Verified in both themes.
- **Color is never the only signal** — pair with icon/label (e.g. bad-review = red + ⚠ + "1★").

---

## 3. Typography

- **Font:** `Inter` (variable) via `next/font` for UI; `Geist Mono` for numbers/code. Optional
  display tracking for hero. No layout shift (font preloaded, `display: swap` avoided via `next/font`).
- **Type scale** (1.250 major-third-ish, tuned):

| Token | Size / line-height | Weight | Use |
|-------|--------------------|--------|-----|
| `display` | 56/60 | 700, -0.02em | Landing hero |
| `h1` | 36/40 | 700, -0.02em | Page title |
| `h2` | 28/34 | 600, -0.01em | Section |
| `h3` | 22/28 | 600 | Card title |
| `body-lg` | 17/26 | 400 | Lead paragraph |
| `body` | 15/24 | 400 | Default |
| `body-sm` | 13/20 | 400 | Secondary |
| `caption` | 12/16 | 500 | Labels, meta |
| `mono` | 14/20 | 500 | Metrics, IDs |

- Numerals use `tabular-nums` in dashboards so figures don't jitter.

---

## 4. Spacing, radius, elevation

- **Spacing scale (4px base):** 0, 1(4), 2(8), 3(12), 4(16), 5(20), 6(24), 8(32), 10(40), 12(48),
  16(64), 20(80), 24(96). Use the scale only — no magic numbers.
- **Radius:** `sm 8px`, `md 12px`, `lg 16px`, `xl 20px`, `2xl 24px`, `full`. Cards `lg`, buttons `md`,
  pills `full`. Consistent, generous — the Apple "soft" feel.
- **Elevation (soft, layered, low-spread):**

```css
--shadow-xs: 0 1px 2px rgba(16,24,40,.05);
--shadow-sm: 0 1px 3px rgba(16,24,40,.08), 0 1px 2px rgba(16,24,40,.04);
--shadow-md: 0 4px 12px rgba(16,24,40,.08), 0 2px 4px rgba(16,24,40,.04);
--shadow-lg: 0 12px 32px rgba(16,24,40,.10), 0 4px 8px rgba(16,24,40,.04);
--shadow-xl: 0 24px 64px rgba(16,24,40,.14);
```
Shadows are subtle and tinted toward blue-gray, never harsh black. Dark mode uses borders + faint glow.

---

## 5. Motion

- **Library:** Motion (Framer Motion). All motion lives in `shared/motion` as reusable variants.
- **Timing:** micro 120ms · default 200ms · enter 240ms · large/page 320ms.
- **Easing:** standard `cubic-bezier(.32,.72,0,1)` (Apple-ish), springs for interactive
  (`stiffness 300, damping 30`).
- **Patterns:** fade-up on mount (8–12px), staggered list children (40ms), scale-press on buttons
  (`0.98`), shared-layout transitions for tab/segment indicators, modal scale-in (`.96→1`) + backdrop fade.
- **Reduced motion:** `prefers-reduced-motion` → cross-fades only, no transforms.
- **60fps rule:** animate `transform`/`opacity` only; never animate layout-affecting properties.

```ts
// shared/motion/variants.ts (sketch)
export const fadeUp = { hidden:{opacity:0,y:12}, show:{opacity:1,y:0,
  transition:{duration:.24, ease:[.32,.72,0,1]}} };
export const stagger = { show:{ transition:{ staggerChildren:.04 } } };
```

---

## 6. Component library (`src/shared/ui`)

Owned, not black-boxed (shadcn-style: Radix behavior + our styling). Each ships all states + a11y.

### 6.1 Primitives
- **Button** — variants: `primary | secondary | ghost | outline | destructive | link`; sizes
  `sm | md | lg | icon`; states: default/hover/active/focus-visible/disabled/**loading** (spinner +
  preserved width). Press scale 0.98.
- **Input / Textarea** — label, hint, error, leading/trailing icon, clearable; focus ring; invalid state.
- **Select / Combobox** — searchable, keyboard-nav, async options.
- **Checkbox / Switch / Radio** — animated, accessible.
- **Card** — header/content/footer slots; hover lift (interactive variant).
- **Badge / Tag / Pill** — semantic colors; rating badge.
- **Avatar** — image/fallback initials; group stacking.
- **Tooltip / Popover / Dropdown Menu** — Radix-backed, animated.
- **Dialog / Sheet / Drawer** — scale-in modal (desktop), bottom sheet (mobile).
- **Tabs / Segmented control** — shared-layout animated indicator.
- **Progress / Meter** — usage bars, onboarding progress.
- **Toast (Sonner)** — success/error/info/loading→resolve; action button; stacked.
- **Skeleton** — shimmer; composeable shapes.
- **Tooltip, Separator, ScrollArea, Kbd** — supporting primitives.

### 6.2 Patterns (`shared/ui/patterns`)
- **PageHeader** — title, subtitle, actions, breadcrumb.
- **StatCard** — metric + delta + sparkline (dashboard).
- **DataTable** — sticky header, sort, multi-select, row actions, pagination, density toggle,
  column visibility, loading/empty states. Used by Reviews, Customers, Requests.
- **EmptyState** — illustration/icon, headline, body, primary CTA (every list has one).
- **ErrorState** — friendly message + retry; never a raw stack trace.
- **CommandPalette (⌘K)** — fuzzy nav + quick actions (Linear/Arc-style).
- **FilterBar** — chips, search, saved views, sort, date range.
- **ConfirmDialog** — destructive confirmations with typed-to-confirm for dangerous ops.
- **Stepper / Wizard** — onboarding & CSV import.
- **RatingStars** — display + interactive.
- **Timeline** — request status lifecycle, review activity.

---

## 7. Layout & navigation
- **App shell:** left sidebar (collapsible, icon-rail on mobile→bottom tab bar), top bar with
  business switcher, search (⌘K), notifications, profile menu.
- **Content max-width** ~1200px; comfortable gutters; 12-col responsive grid.
- **Breakpoints:** `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`. **Mobile-first**; every screen
  designed at 375px first, enhanced upward.
- **Density:** comfortable default; compact toggle for power users on tables.

---

## 8. Required states for every data view
| State | Standard |
|-------|----------|
| **Loading** | Skeleton matching final layout (no spinners-on-blank); streamed via Suspense |
| **Empty** | `EmptyState` with a clear primary CTA and one-line guidance |
| **Error** | `ErrorState` with human message + Retry; log details, never expose internals |
| **Success** | Toast + inline confirmation + optimistic UI update |
| **Partial** | Show what loaded; inline retry for the failed region |
| **Offline** | Banner + cached data + queued actions where safe |

---

## 9. Signature experiences (the "wow" moments)
- **Onboarding** — full-screen, multi-step wizard with progress, live preview of the review message,
  and a celebratory success screen when Google connects and first reviews stream in.
- **Dashboard** — animated stat cards with rating trend sparklines that count up on load; live
  "new review" pulse via Realtime.
- **Review reply** — AI draft types in with a subtle shimmer; one-click **Post**, **Regenerate**, inline
  edit; success confetti-free but a satisfying check animation.
- **Bad-review alert** — a calm but urgent red card that slides in; one-tap acknowledge.
- **Command palette (⌘K)** — jump anywhere, do anything, instantly.
- **Send request** — select customers → single confident button → animated send + status timeline.

---

## 10. Accessibility checklist (enforced)
- All interactive elements keyboard-reachable with visible focus ring (`--ring`).
- Semantic HTML + ARIA only where needed (Radix handles most).
- Color contrast AA verified in light & dark.
- Forms: label + error association (`aria-describedby`), inline validation, no color-only errors.
- Motion respects `prefers-reduced-motion`.
- Touch targets ≥ 44×44px; mobile-first ergonomics.
- Screen-reader labels for icon-only buttons.

---

## 11. Theming & personalization (user control)
- **Light / Dark / System** theme (next-themes), persisted, no flash (SSR-safe).
- **Density** (comfortable/compact), **brand tone** for AI replies, **language** (EN / Urdu-Hindi romanized).
- **Saved views & filters** per list; remembered sort and columns.
- **Notification preferences** per channel/event.
- Personalization stored per user/business and restored on load.

---

## 12. Implementation rules
- Components live only in `shared/ui` (generic) or `features/<x>/presentation/components` (specific).
- Styling via Tailwind utility classes + `cva` for variants + `cn()` merge. No inline magic numbers.
- Tokens only — never hardcode hex/px outside the token definitions.
- Every primitive: typed props, forwardRef, all states, a11y, and a Storybook-style usage example.
- Dark mode is not optional — build both from day one.
- Performance: prefer RSC; mark `'use client'` only when interactive; lazy-load heavy widgets (charts).
