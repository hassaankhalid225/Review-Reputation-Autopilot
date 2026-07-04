/** PORTS for connecting, storing and reading a business's review sources. */
import type { Result } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { Platform } from "./platform";
import type { ReviewSource } from "./review-source.entity";

/** User-supplied connection details (link platforms) or OAuth result (api platforms). */
export interface ProviderConnectInput {
  reviewLink?: string;
  profileUrl?: string;
  externalId?: string;
  displayName?: string;
  /** Opaque credentials to encrypt at rest (OAuth tokens, api keys). */
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
}

/**
 * PORT: a per-platform provider. Validates/normalizes a connection and (when a
 * live API is configured) can ingest reviews. Link-only providers return
 * autoIngest=false and simply capture the public review link.
 */
export interface ReviewSourceProvider {
  readonly platform: Platform;
  /** True when live API credentials exist to auto-ingest reviews. */
  isConfigured(): boolean;
  /** Validate and normalize the owner's connection input. */
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
