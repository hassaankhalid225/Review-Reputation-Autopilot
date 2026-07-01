/** Use case: soft-delete a customer (sets deleted_at; preserves request history). */
import { Result } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { AuditLogger } from "@/core/audit/audit-logger";
import type { CustomerRepository } from "../domain/customer.repository";

export class DeleteCustomerUseCase {
  constructor(
    private readonly repo: CustomerRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(actorId: string, businessId: string, customerId: string): Promise<Result<void, AppError>> {
    const result = await this.repo.softDelete(businessId, customerId);
    if (result.isOk()) {
      await this.audit.record({
        businessId,
        actorId,
        action: "customer.deleted",
        entity: "customer",
        entityId: customerId,
      });
    }
    return result;
  }
}
