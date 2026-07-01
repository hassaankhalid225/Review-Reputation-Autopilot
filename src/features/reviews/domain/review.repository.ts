/** PORT: ReviewRepository — read/reply over ingested reviews + dashboard metrics. */
import type { Result } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { Paginated, PageQuery } from "@/core/types/pagination";
import type { Review, ReplyStatus } from "./review.entity";

export type ReviewFilter = "all" | "needs_reply" | "negative";

export interface ListReviewsQuery extends PageQuery {
  businessId: string;
  filter?: ReviewFilter;
}

export interface DashboardMetrics {
  avgRating: number;
  totalReviews: number;
  responseRate: number;
  newThisWeek: number;
  deltas: { rating: number; reviews: number; response: number; week: number };
  ratingTrend: number[];
}

export interface ReviewRepository {
  list(query: ListReviewsQuery): Promise<Result<Paginated<Review>, AppError>>;
  findById(businessId: string, id: string): Promise<Result<Review | null, AppError>>;
  saveReply(
    businessId: string,
    reviewId: string,
    replyText: string,
    status: ReplyStatus,
  ): Promise<Result<Review, AppError>>;
  metrics(businessId: string): Promise<Result<DashboardMetrics, AppError>>;
  recent(businessId: string, limit: number): Promise<Result<Review[], AppError>>;
}
