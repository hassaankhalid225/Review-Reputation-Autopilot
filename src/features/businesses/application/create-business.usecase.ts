/**
 * Use case: create the caller's business (the onboarding "Business" step).
 * Validates via the entity, persists via the port, audits, returns a view.
 */
import { Result, err } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { AuditLogger } from "@/core/audit/audit-logger";
import { Business } from "../domain/business.entity";
import type { BusinessRepository } from "../domain/business.repository";
import { type BusinessView, type CreateBusinessInput, toBusinessView } from "./business.dto";

export class CreateBusinessUseCase {
  constructor(
    private readonly repo: BusinessRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(input: CreateBusinessInput): Promise<Result<BusinessView, AppError>> {
    const entity = Business.create({
      ownerId: input.ownerId,
      name: input.name,
      category: input.category,
      city: input.city,
      country: input.country,
    });
    if (entity.isErr()) return err(entity.error);

    const saved = await this.repo.create(entity.value);
    if (saved.isErr()) return err(saved.error);

    await this.audit.record({
      businessId: saved.value.id,
      actorId: input.ownerId,
      action: "business.created",
      entity: "business",
      entityId: saved.value.id,
      metadata: { name: saved.value.name },
    });

    return saved.map(toBusinessView);
  }
}
