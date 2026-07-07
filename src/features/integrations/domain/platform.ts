/**
 * Review platforms a business can connect. The `source` column on `reviews`
 * stores one of these ids, so reviews from every platform live in one feed.
 *
 * Defined here in the domain (framework-free); `network/supabase/types` mirrors
 * the same literal unions for the DB row typing.
 */
export type Platform = "google" | "facebook" | "instagram" | "yelp" | "tripadvisor" | "trustpilot";
export type SourceStatus = "connected" | "pending" | "revoked" | "error";

export const PLATFORMS: readonly Platform[] = [
  "google",
  "facebook",
  "instagram",
  "yelp",
  "tripadvisor",
  "trustpilot",
] as const;

export function isPlatform(value: string): value is Platform {
  return (PLATFORMS as readonly string[]).includes(value);
}

/**
 * How a platform is connected (the intended method when its keys are set):
 *  - "oauth"  → redirect the owner through the platform's consent screen (Facebook).
 *  - "api"    → look the business up via the platform's API with our app key
 *               (Yelp, TripAdvisor, Trustpilot).
 *  - "link"   → paste a public review link (Instagram — no reviews API; and the
 *               fallback for any platform whose keys aren't set yet).
 *
 * The runtime source of truth is the provider registry (a platform degrades to
 * "link" until its credentials are configured); this is the design intent.
 */
export type ConnectMethod = "oauth" | "api" | "link";

export interface PlatformCapability {
  platform: Platform;
  method: ConnectMethod;
  /** Whether reviews can be ingested automatically via API. */
  autoIngest: boolean;
}

export const PLATFORM_CAPABILITIES: Record<Platform, PlatformCapability> = {
  google: { platform: "google", method: "oauth", autoIngest: true },
  facebook: { platform: "facebook", method: "oauth", autoIngest: true },
  instagram: { platform: "instagram", method: "link", autoIngest: false },
  yelp: { platform: "yelp", method: "api", autoIngest: true },
  tripadvisor: { platform: "tripadvisor", method: "api", autoIngest: true },
  trustpilot: { platform: "trustpilot", method: "api", autoIngest: true },
};
