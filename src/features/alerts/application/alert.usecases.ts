/** Application layer: alert use cases (list, count, acknowledge). */
import { Result } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { AuditLogger } from "@/core/audit/audit-logger";
import type { AlertRepository } from "../domain/alert.repository";
import { type AlertView, toAlertView } from "./alert.dto";

export class ListAlertsUseCase {
  constructor(private readonly repo: AlertRepository) {}

  async execute(businessId: string, onlyUnacked = false): Promise<Result<AlertView[], AppError>> {
    const result = await this.repo.list(businessId, onlyUnacked);
    return result.map((alerts) => alerts.map(toAlertView));
  }
}

export class CountUnackedAlertsUseCase {
  constructor(private readonly repo: AlertRepository) {}

  execute(businessId: string): Promise<Result<number, AppError>> {
    return this.repo.countUnacknowledged(businessId);
  }
}

export class AcknowledgeAlertUseCase {
  constructor(
    private readonly repo: AlertRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(actorId: string, businessId: string, alertId: string): Promise<Result<void, AppError>> {
    const result = await this.repo.acknowledge(businessId, alertId, actorId);
    if (result.isOk()) {
      await this.audit.record({
        businessId,
        actorId,
        action: "alert.acknowledged",
        entity: "alert",
        entityId: alertId,
      });
    }
    return result;
  }
}
