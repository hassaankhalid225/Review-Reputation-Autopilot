/** Use case: load public widget data for a business (null when disabled). */
import { Result, ok, err } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { WidgetData, WidgetRepository } from "../domain/widget.ports";

export class GetWidgetUseCase {
  constructor(private readonly repo: WidgetRepository) {}

  async execute(businessId: string): Promise<Result<WidgetData | null, AppError>> {
    const result = await this.repo.getData(businessId);
    if (result.isErr()) return err(result.error);
    const data = result.value;
    if (!data || !data.config.enabled) return ok(null);
    return ok(data);
  }
}
