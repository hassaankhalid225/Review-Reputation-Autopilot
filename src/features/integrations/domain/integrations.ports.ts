/** PORTS for connecting, storing and reading a business's review sources. */
import type { Result } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { ConnectMethod, Platform } from "./platform";
import type { ReviewSource } from "./review-source.entity";

export type { ConnectMethod };

/** A single review pulled from a platform, normalized for ingestion. */
export interface NormalizedReview {
  externalId: string;
  rating: number; // 1..5
  text: string | null;
  authorName: string | null;
  createdAt: string | null;
}

/** User-supplied connection details for api/link providers. */
export interface ProviderConnectInput {
  /** A public URL/domain, OR a business name to search for (api providers). */
  query?: string;
  /** City/region to disambiguate an auto-search (api providers). */
  location?: string;
  reviewLink?: string;
  profileUrl?: string;
  externalId?: string;
  displayName?: string;
  credentials?: Record<string, string>;
}

/** A validated, normalized connection ready to persist. */
export interface ConnectedSource {
  platform: Platform;
  externalId: string | null;
  displayName: string | null;
  reviewLink: string | null;
  profileUrl: string | null;
  credentials: Record<string, string> | null;
  /** Cached rating summary (from the platform), if available. */
  avgRating?: number | null;
  reviewCount?: number | null;
  /** Sample reviews fetched at connect time — ingested into the reviews feed. */
  reviews?: NormalizedReview[];
}

/**
 * PORT: a per-platform provider. Three connect methods:
 *  - "oauth" → redirect the owner through the platform's consent screen
 *    (buildAuthUrl) then exchange the callback code (completeAuth). Like Google.
 *  - "api"   → look the business up through the platform's API with our app key
 *    (connect with a query/URL), pulling rating + sample reviews.
 *  - "link"  → the owner pastes a public review link (no API).
 */
export interface ReviewSourceProvider {
  readonly platform: Platform;
  readonly method: ConnectMethod;
  /** True when live API credentials exist to talk to the platform. */
  isConfigured(): boolean;
  /** OAuth only: the consent URL. `state` carries CSRF nonce + business id. */
  buildAuthUrl?(state: string): string;
  /** OAuth only: exchange the callback code for a connected source. */
  completeAuth?(code: string): Promise<Result<ConnectedSource, AppError>>;
  /** api/link: validate + normalize (and, for api, fetch) from user input. */
  connect(input: ProviderConnectInput): Promise<Result<ConnectedSource, AppError>>;
}

/** PORT: resolves providers by platform. */
export interface ReviewSourceProviderRegistry {
  get(platform: Platform): ReviewSourceProvider | null;
  all(): ReviewSourceProvider[];
}

/** PORT: persistence for connected sources (credentials encrypted at rest). */
export interface ReviewSourceRepository {
  list(businessId: string): Promise<Result<ReviewSource[], AppError>>;
  get(businessId: string, platform: Platform): Promise<Result<ReviewSource | null, AppError>>;
  save(businessId: string, conn: ConnectedSource): Promise<Result<void, AppError>>;
  remove(businessId: string, platform: Platform): Promise<Result<void, AppError>>;
}

/** PORT: upserts pulled reviews into the unified reviews feed. */
export interface ReviewIngestionRepository {
  upsertMany(
    businessId: string,
    platform: Platform,
    reviews: NormalizedReview[],
  ): Promise<Result<number, AppError>>;
}
