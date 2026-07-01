/** Use case: dashboard metrics + recent reviews for the active business. */
import { Result, err, ok } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { DashboardMetrics, ReviewRepository } from "../domain/review.repository";
import { type ReviewView, toReviewView } from "./review.dto";

export interface DashboardData {
  metrics: DashboardMetrics;
  recent: ReviewView[];
}

export class GetDashboardUseCase {
  constructor(private readonly repo: ReviewRepository) {}

  async execute(businessId: string): Promise<Result<DashboardData, AppError>> {
    const metrics = await this.repo.metrics(businessId);
    if (metrics.isErr()) return err(metrics.error);
    const recent = await this.repo.recent(businessId, 5);
    if (recent.isErr()) return err(recent.error);
    return ok({ metrics: metrics.value, recent: recent.value.map(toReviewView) });
  }
}
