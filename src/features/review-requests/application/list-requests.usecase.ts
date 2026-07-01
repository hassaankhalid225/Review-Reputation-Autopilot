/** Use case: paginated list of a business's review requests. */
import { Result } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { Paginated } from "@/core/types/pagination";
import type { ListRequestsQuery, ReviewRequestRepository } from "../domain/review-request.repository";
import { type RequestView, toRequestView } from "./request.dto";

export class ListRequestsUseCase {
  constructor(private readonly repo: ReviewRequestRepository) {}

  async execute(query: ListRequestsQuery): Promise<Result<Paginated<RequestView>, AppError>> {
    const result = await this.repo.list(query);
    return result.map((page) => ({ ...page, items: page.items.map(toRequestView) }));
  }
}
