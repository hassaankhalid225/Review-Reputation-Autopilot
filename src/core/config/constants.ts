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

/** Currencies offered in Settings (code + symbol + label). */
export const CURRENCIES = [
  { code: "PKR", symbol: "₨", label: "Pakistani Rupee" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", label: "Saudi Riyal" },
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
] as const;

/** A pragmatic timezone shortlist for the target markets. */
export const TIMEZONES = [
  "Asia/Karachi",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Kolkata",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
] as const;

/** Languages an owner can serve customers / draft replies in. */
export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ur", label: "Urdu" },
  { code: "ar", label: "Arabic" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
] as const;

/** Which social platforms Settings lets an owner link. */
export const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", placeholder: "instagram.com/yourbrand" },
  { key: "facebook", label: "Facebook", placeholder: "facebook.com/yourbrand" },
  { key: "tiktok", label: "TikTok", placeholder: "tiktok.com/@yourbrand" },
  { key: "youtube", label: "YouTube", placeholder: "youtube.com/@yourbrand" },
  { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/company/yourbrand" },
  { key: "twitter", label: "X (Twitter)", placeholder: "x.com/yourbrand" },
] as const;

/** Review request anti-spam window (days). */
export const REQUEST_COOLDOWN_DAYS = 30;
