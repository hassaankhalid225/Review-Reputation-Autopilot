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
    if (
      patch.brandColor != null &&
      patch.brandColor !== "" &&
      !/^#[0-9a-fA-F]{6}$/.test(patch.brandColor)
    ) {
      return err(new ValidationError("Brand colour must be a 6-digit hex like #4f46e5."));
    }
    if (patch.description != null && patch.description.length > 1200) {
      return err(new ValidationError("Description is too long."));
    }
    if (patch.aiContext != null && patch.aiContext.length > 1500) {
      return err(new ValidationError("AI context is too long."));
    }
    if (patch.replyTemplates !== undefined) {
      if (patch.replyTemplates.length > 30) {
        return err(new ValidationError("You can save up to 30 reply templates."));
      }
      if (patch.replyTemplates.some((t) => !t.title.trim() || !t.body.trim())) {
        return err(new ValidationError("Each template needs a title and a body."));
      }
    }
    if (patch.brandFacts !== undefined) {
      if (patch.brandFacts.length > 40) {
        return err(new ValidationError("You can save up to 40 brand facts."));
      }
      if (patch.brandFacts.some((f) => !f.label.trim() || !f.value.trim())) {
        return err(new ValidationError("Each brand fact needs a label and a value."));
      }
    }

    const existing = await this.repo.findById(businessId);
    if (existing.isErr()) return err(existing.error);
    if (!existing.value) return err(new NotFoundError("Business not found."));

    const updated = await this.repo.update(businessId, patch);
    if (updated.isErr()) return err(updated.error);

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
