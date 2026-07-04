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
 * How a platform is connected:
 *  - "oauth"  → redirect the owner through the platform's consent screen (e.g. Google, Facebook).
 *  - "link"   → the owner pastes their public review/profile link (no API needed to start collecting).
 */
export type ConnectMethod = "oauth" | "link";

export interface PlatformCapability {
  platform: Platform;
  /** How connecting works for this platform. */
  method: ConnectMethod;
  /** Whether we can ingest reviews automatically via API (vs link-only for now). */
  autoIngest: boolean;
}

export const PLATFORM_CAPABILITIES: Record<Platform, PlatformCapability> = {
  google: { platform: "google", method: "oauth", autoIngest: true },
  facebook: { platform: "facebook", method: "oauth", autoIngest: false },
  instagram: { platform: "instagram", method: "oauth", autoIngest: false },
  yelp: { platform: "yelp", method: "link", autoIngest: false },
  tripadvisor: { platform: "tripadvisor", method: "link", autoIngest: false },
  trustpilot: { platform: "trustpilot", method: "link", autoIngest: false },
};
