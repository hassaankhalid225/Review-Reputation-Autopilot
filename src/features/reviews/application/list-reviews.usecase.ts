/** Use case: paginated, filtered review list (RLS-scoped). */
import { Result } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { Paginated } from "@/core/types/pagination";
import type { ReviewRepository, ListReviewsQuery } from "../domain/review.repository";
import { type ReviewView, toReviewView } from "./review.dto";

export class ListReviewsUseCase {
  constructor(private readonly repo: ReviewRepository) {}

  async execute(query: ListReviewsQuery): Promise<Result<Paginated<ReviewView>, AppError>> {
    const result = await this.repo.list(query);
    return result.map((page) => ({ ...page, items: page.items.map(toReviewView) }));
  }
}
