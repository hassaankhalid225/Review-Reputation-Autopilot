/** PORT: AlertRepository. */
import type { Result } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { Alert } from "./alert.entity";

export interface AlertRepository {
  list(businessId: string, onlyUnacked: boolean): Promise<Result<Alert[], AppError>>;
  countUnacknowledged(businessId: string): Promise<Result<number, AppError>>;
  acknowledge(businessId: string, alertId: string, userId: string): Promise<Result<void, AppError>>;
}
