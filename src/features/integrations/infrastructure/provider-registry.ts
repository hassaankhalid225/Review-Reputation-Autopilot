/**
 * ADAPTER: DefaultProviderRegistry — resolves a ReviewSourceProvider per
 * platform. When a platform's live API/OAuth credentials are set, the real
 * adapter is bound (Facebook OAuth; Yelp/TripAdvisor/Trustpilot API); otherwise
 * it falls back to the link-based provider so the owner can still connect.
 * Instagram has no reviews API, so it stays link-based (sharing only).
 */
import "server-only";
import type { Platform } from "../domain/platform";
import { PLATFORMS } from "../domain/platform";
import type { ReviewSourceProvider, ReviewSourceProviderRegistry } from "../domain/integrations.ports";
import { LinkSourceProvider } from "./link-source.provider";
import { FacebookSourceProvider } from "./providers/facebook-source.provider";
import { YelpSourceProvider } from "./providers/yelp-source.provider";
import { TripAdvisorSourceProvider } from "./providers/tripadvisor-source.provider";
import { TrustpilotSourceProvider } from "./providers/trustpilot-source.provider";

/** Build the real provider for a platform when its credentials are configured. */
function realProviders(): Partial<Record<Platform, ReviewSourceProvider>> {
  const candidates: ReviewSourceProvider[] = [
    new FacebookSourceProvider(),
    new YelpSourceProvider(),
    new TripAdvisorSourceProvider(),
    new TrustpilotSourceProvider(),
  ];
  const map: Partial<Record<Platform, ReviewSourceProvider>> = {};
  for (const p of candidates) {
    if (p.isConfigured()) map[p.platform] = p;
  }
  return map;
}

export class DefaultProviderRegistry implements ReviewSourceProviderRegistry {
  private readonly providers: Map<Platform, ReviewSourceProvider>;

  constructor(overrides: Partial<Record<Platform, ReviewSourceProvider>> = realProviders()) {
    this.providers = new Map(
      PLATFORMS.map((p) => [p, overrides[p] ?? new LinkSourceProvider(p)] as const),
    );
  }

  get(platform: Platform): ReviewSourceProvider | null {
    return this.providers.get(platform) ?? null;
  }

  all(): ReviewSourceProvider[] {
    return [...this.providers.values()];
  }
}
