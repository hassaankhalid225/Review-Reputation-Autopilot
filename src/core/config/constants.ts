/** App-wide constants and metadata. */

export const APP = {
  name: "Reputation Autopilot",
  shortName: "Autopilot",
  tagline: "Turn happy customers into 5-star reviews — on autopilot.",
  description:
    "Collect more Google reviews, reply with AI, and catch bad reviews before they hurt your business.",
  domain: "reputationautopilot.com",
} as const;

export const SUPPORT_EMAIL = "hello@reputationautopilot.com";

/** Plan definitions — single source of truth for limits & pricing (see Docs/PRD.md §7). */
export const PLANS = {
  trial: {
    id: "trial",
    name: "Free Trial",
    priceLocal: 0,
    priceUsd: 0,
    locations: 1,
    requestsPerMonth: 50,
    aiRepliesPerMonth: 50,
    badReviewAlerts: true,
    competitorView: false,
    trialDays: 14,
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceLocal: 150000, // ₨1,500 in minor units (paisa)
    priceUsd: 2900, // $29.00 in cents
    locations: 1,
    requestsPerMonth: 300,
    aiRepliesPerMonth: Number.POSITIVE_INFINITY,
    badReviewAlerts: true,
    competitorView: false,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceLocal: 400000, // ₨4,000
    priceUsd: 7900, // $79.00
    locations: 5,
    requestsPerMonth: 1500,
    aiRepliesPerMonth: Number.POSITIVE_INFINITY,
    badReviewAlerts: true,
    competitorView: true,
  },
} as const;

export type PlanId = keyof typeof PLANS;

export const BRAND_TONES = [
  { id: "friendly", label: "Friendly", hint: "Warm and personable" },
  { id: "formal", label: "Formal", hint: "Polished and professional" },
  { id: "short", label: "Short & sweet", hint: "Concise and to the point" },
] as const;

export const BUSINESS_CATEGORIES = [
  "Restaurant / Café",
  "Salon / Barber",
  "Dental / Beauty Clinic",
  "Gym / Fitness",
  "Car / Phone Repair",
  "Retail Store",
  "Hotel / Guesthouse",
  "Other",
] as const;

/** Review request anti-spam window (days). */
export const REQUEST_COOLDOWN_DAYS = 30;
