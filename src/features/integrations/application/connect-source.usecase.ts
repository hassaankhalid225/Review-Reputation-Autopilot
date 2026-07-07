/**
 * Use case: connect (or update) a review source for a business via the API/link
 * method. Resolves the platform provider, validates + fetches, persists, then
 * ingests any pulled reviews into the unified feed.
 */
import { Result, err, ok } from "@/core/result/result";
import { type AppError, ValidationError } from "@/core/errors/app-error";
import type { AuditLogger } from "@/core/audit/audit-logger";
import type { Platform } from "../domain/platform";
import type {
  ConnectedSource,
  ProviderConnectInput,
  ReviewIngestionRepository,
  ReviewSourceProviderRegistry,
  ReviewSourceRepository,
} from "../domain/integrations.ports";

export class ConnectSourceUseCase {
  constructor(
    private readonly registry: ReviewSourceProviderRegistry,
    private readonly repo: ReviewSourceRepository,
    private readonly ingestion: ReviewIngestionRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(
    actorId: string,
    businessId: string,
    platform: Platform,
    input: ProviderConnectInput,
  ): Promise<Result<void, AppError>> {
    const provider = this.registry.get(platform);
    if (!provider) return err(new ValidationError(`Unsupported platform: ${platform}.`));

    const connected = await provider.connect(input);
    if (connected.isErr()) return err(connected.error);

    return this.persist(actorId, businessId, connected.value);
  }

  /** Shared persist + ingest path (also used by the OAuth completion flow). */
  async persist(
    actorId: string,
    businessId: string,
    connected: ConnectedSource,
  ): Promise<Result<void, AppError>> {
    const saved = await this.repo.save(businessId, connected);
    if (saved.isErr()) return err(saved.error);

    if (connected.reviews && connected.reviews.length > 0) {
      const ingested = await this.ingestion.upsertMany(businessId, connected.platform, connected.reviews);
      if (ingested.isErr()) return err(ingested.error);
    }

    await this.audit.record({
      businessId,
      actorId,
      action: "source.connected",
      entity: "review_source",
      metadata: { platform: connected.platform, reviews: connected.reviews?.length ?? 0 },
    });
    return ok(undefined);
  }
}
