/**
 * Use case: connect (or update) a review source for a business.
 * Resolves the platform provider, validates the input, then persists.
 */
import { Result, err, ok } from "@/core/result/result";
import { type AppError, ValidationError } from "@/core/errors/app-error";
import type { AuditLogger } from "@/core/audit/audit-logger";
import type { Platform } from "@/network/supabase/types";
import type {
  ProviderConnectInput,
  ReviewSourceProviderRegistry,
  ReviewSourceRepository,
} from "../domain/integrations.ports";

export class ConnectSourceUseCase {
  constructor(
    private readonly registry: ReviewSourceProviderRegistry,
    private readonly repo: ReviewSourceRepository,
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

    const saved = await this.repo.save(businessId, connected.value);
    if (saved.isErr()) return err(saved.error);

    await this.audit.record({
      businessId,
      actorId,
      action: "source.connected",
      entity: "review_source",
      metadata: { platform },
    });
    return ok(undefined);
  }
}
