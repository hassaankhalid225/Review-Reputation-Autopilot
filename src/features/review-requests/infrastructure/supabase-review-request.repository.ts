/**
 * ADAPTER: SupabaseReviewRequestRepository.
 * Member-scoped methods rely on RLS (server scope); `findByToken`/`recordClick`
 * are used by the public redirect in the service scope (no session).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { Result, ok, err } from "@/core/result/result";
import { type AppError, ConflictError, InternalError } from "@/core/errors/app-error";
import { type Paginated, paginate, toRange } from "@/core/types/pagination";
import type { Database } from "@/network/supabase/types";
import type { ReviewRequest, RequestStatus } from "../domain/review-request.entity";
import type {
  LocationLink,
  ListRequestsQuery,
  NewReviewRequestData,
  RequestByToken,
  ReviewRequestRepository,
} from "../domain/review-request.repository";
import { mapRequestRow } from "./review-request.mapper";

const STATUS_TIMESTAMP: Partial<Record<RequestStatus, "sent_at" | "delivered_at" | "clicked_at" | "reviewed_at">> = {
  sent: "sent_at",
  delivered: "delivered_at",
  clicked: "clicked_at",
  reviewed: "reviewed_at",
};

export class SupabaseReviewRequestRepository implements ReviewRequestRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async create(data: NewReviewRequestData): Promise<Result<ReviewRequest, AppError>> {
    const { data: row, error } = await this.db
      .from("review_requests")
      .insert({
        business_id: data.businessId,
        customer_id: data.customerId,
        location_id: data.locationId,
        channel: data.channel,
        status: "queued",
        short_token: data.shortToken,
        idempotency_key: data.idempotencyKey,
      })
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") return err(new ConflictError("Duplicate request."));
      return err(new InternalError("Could not create request.", error));
    }
    return ok(mapRequestRow(row));
  }

  async markStatus(
    id: string,
    status: RequestStatus,
    patch?: { providerMessageId?: string; error?: string },
  ): Promise<Result<void, AppError>> {
    const stampKey = STATUS_TIMESTAMP[status];
    const { error } = await this.db
      .from("review_requests")
      .update({
        status,
        ...(stampKey ? { [stampKey]: new Date().toISOString() } : {}),
        ...(patch?.providerMessageId ? { provider_message_id: patch.providerMessageId } : {}),
        ...(patch?.error ? { error: patch.error } : {}),
      })
      .eq("id", id);
    if (error) return err(new InternalError("Could not update request.", error));
    return ok(undefined);
  }

  async list(query: ListRequestsQuery): Promise<Result<Paginated<ReviewRequest>, AppError>> {
    const { from, to, page, pageSize } = toRange(query);
    const { data, error, count } = await this.db
      .from("review_requests")
      .select("*", { count: "exact" })
      .eq("business_id", query.businessId)
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) return err(new InternalError("Could not load requests.", error));
    return ok(paginate(data.map(mapRequestRow), count ?? 0, page, pageSize));
  }

  async primaryLocation(businessId: string): Promise<Result<LocationLink | null, AppError>> {
    const { data, error } = await this.db
      .from("google_locations")
      .select("id, review_link, status")
      .eq("business_id", businessId)
      .eq("status", "connected")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return err(new InternalError("Could not load location.", error));
    if (!data) return ok(null);
    return ok({ locationId: data.id, reviewLink: data.review_link });
  }

  async wasRequestedSince(
    businessId: string,
    customerId: string,
    sinceIso: string,
  ): Promise<Result<boolean, AppError>> {
    const { count, error } = await this.db
      .from("review_requests")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("customer_id", customerId)
      .gte("created_at", sinceIso);
    if (error) return err(new InternalError("Could not check request history.", error));
    return ok((count ?? 0) > 0);
  }

  async findByToken(shortToken: string): Promise<Result<RequestByToken | null, AppError>> {
    const { data, error } = await this.db
      .from("review_requests")
      .select("id, business_id, location_id")
      .eq("short_token", shortToken)
      .maybeSingle();
    if (error) return err(new InternalError("Could not resolve link.", error));
    if (!data) return ok(null);

    let reviewLink: string | null = null;
    if (data.location_id) {
      const loc = await this.db
        .from("google_locations")
        .select("review_link")
        .eq("id", data.location_id)
        .maybeSingle();
      reviewLink = loc.data?.review_link ?? null;
    }
    return ok({ id: data.id, businessId: data.business_id, reviewLink });
  }

  async recordClick(id: string): Promise<Result<void, AppError>> {
    const { error } = await this.db
      .from("review_requests")
      .update({ status: "clicked", clicked_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return err(new InternalError("Could not record click.", error));
    return ok(undefined);
  }
}
