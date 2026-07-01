/** PORT: ReviewRequestRepository + supporting read models. */
import type { Result } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { Paginated, PageQuery } from "@/core/types/pagination";
import type { ReviewRequest, RequestChannel, RequestStatus } from "./review-request.entity";

export interface NewReviewRequestData {
  businessId: string;
  customerId: string;
  locationId: string | null;
  channel: RequestChannel;
  shortToken: string;
  idempotencyKey: string;
}

/** A location's public review link + connection state, for sending requests. */
export interface LocationLink {
  locationId: string;
  reviewLink: string | null;
}

/** Resolved by short token at the public redirect endpoint. */
export interface RequestByToken {
  id: string;
  businessId: string;
  reviewLink: string | null;
}

export interface ListRequestsQuery extends PageQuery {
  businessId: string;
}

export interface ReviewRequestRepository {
  create(data: NewReviewRequestData): Promise<Result<ReviewRequest, AppError>>;
  markStatus(
    id: string,
    status: RequestStatus,
    patch?: { providerMessageId?: string; error?: string },
  ): Promise<Result<void, AppError>>;
  list(query: ListRequestsQuery): Promise<Result<Paginated<ReviewRequest>, AppError>>;
  /** Most recent active, connected location for a business (null if none). */
  primaryLocation(businessId: string): Promise<Result<LocationLink | null, AppError>>;
  /** Whether the customer was requested within the cooldown window. */
  wasRequestedSince(businessId: string, customerId: string, sinceIso: string): Promise<Result<boolean, AppError>>;
  /** Public, token-scoped lookup (service-role; no session). */
  findByToken(shortToken: string): Promise<Result<RequestByToken | null, AppError>>;
  recordClick(id: string): Promise<Result<void, AppError>>;
}
