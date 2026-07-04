/** Use case: save the owner's website widget configuration. */
import { Result, err, ok } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { AuditLogger } from "@/core/audit/audit-logger";
import type { WidgetSettingsInput, WidgetSettingsRepository } from "../domain/widget.ports";

export class SaveWidgetSettingsUseCase {
  constructor(
    private readonly repo: WidgetSettingsRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(
    actorId: string,
    businessId: string,
    input: WidgetSettingsInput,
  ): Promise<Result<void, AppError>> {
    const saved = await this.repo.save(businessId, input);
    if (saved.isErr()) return err(saved.error);

    await this.audit.record({
      businessId,
      actorId,
      action: "widget.updated",
      entity: "widget_settings",
      metadata: { enabled: input.enabled },
    });
    return ok(undefined);
  }
}
