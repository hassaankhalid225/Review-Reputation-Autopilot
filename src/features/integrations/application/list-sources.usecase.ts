/** Use case: list a business's connected review sources. */
import { Result, ok, err } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { ReviewSourceRepository } from "../domain/integrations.ports";
import { toReviewSourceView, type ReviewSourceView } from "./source.dto";

export class ListSourcesUseCase {
  constructor(private readonly repo: ReviewSourceRepository) {}

  async execute(businessId: string): Promise<Result<ReviewSourceView[], AppError>> {
    const result = await this.repo.list(businessId);
    if (result.isErr()) return err(result.error);
    return ok(result.value.map(toReviewSourceView));
  }
}
