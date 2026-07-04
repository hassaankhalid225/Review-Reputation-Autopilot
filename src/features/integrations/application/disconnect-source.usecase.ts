/** Use case: disconnect a review source from a business. */
import { Result, err, ok } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { AuditLogger } from "@/core/audit/audit-logger";
import type { Platform } from "@/network/supabase/types";
import type { ReviewSourceRepository } from "../domain/integrations.ports";

export class DisconnectSourceUseCase {
  constructor(
    private readonly repo: ReviewSourceRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(actorId: string, businessId: string, platform: Platform): Promise<Result<void, AppError>> {
    const removed = await this.repo.remove(businessId, platform);
    if (removed.isErr()) return err(removed.error);

    await this.audit.record({
      businessId,
      actorId,
      action: "source.disconnected",
      entity: "review_source",
      metadata: { platform },
    });
    return ok(undefined);
  }
}
