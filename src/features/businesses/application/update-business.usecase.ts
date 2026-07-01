/** Use case: update a business's profile/settings (owner-authorized by RLS). */
import { Result, err } from "@/core/result/result";
import { type AppError, NotFoundError, ValidationError } from "@/core/errors/app-error";
import type { AuditLogger } from "@/core/audit/audit-logger";
import { BRAND_TONES } from "../domain/business.entity";
import type { BusinessRepository, UpdateBusinessPatch } from "../domain/business.repository";
import { type BusinessView, toBusinessView } from "./business.dto";

export class UpdateBusinessUseCase {
  constructor(
    private readonly repo: BusinessRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(
    actorId: string,
    businessId: string,
    patch: UpdateBusinessPatch,
  ): Promise<Result<BusinessView, AppError>> {
    if (patch.name !== undefined && patch.name.trim().length < 2) {
      return err(new ValidationError("Business name is too short."));
    }
    if (patch.brandTone !== undefined && !BRAND_TONES.includes(patch.brandTone)) {
      return err(new ValidationError("Invalid brand tone."));
    }

    const existing = await this.repo.findById(businessId);
    if (existing.isErr()) return err(existing.error);
    if (!existing.value) return err(new NotFoundError("Business not found."));

    const updated = await this.repo.update(businessId, patch);
    if (updated.isErr()) return updated;

    await this.audit.record({
      businessId,
      actorId,
      action: "business.updated",
      entity: "business",
      entityId: businessId,
      metadata: { fields: Object.keys(patch) },
    });

    return updated.map(toBusinessView);
  }
}
