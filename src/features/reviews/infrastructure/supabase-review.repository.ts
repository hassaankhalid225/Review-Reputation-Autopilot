/** ADAPTER: SupabaseReviewRepository — reads/replies + dashboard aggregates. */
import type { SupabaseClient } from "@supabase/supabase-js";
import { Result, ok, err } from "@/core/result/result";
import { type AppError, InternalError, NotFoundError } from "@/core/errors/app-error";
import { type Paginated, paginate, toRange } from "@/core/types/pagination";
import type { Database } from "@/network/supabase/types";
import type { Review, ReplyStatus } from "../domain/review.entity";
import type {
  DashboardMetrics,
  ListReviewsQuery,
  ReviewRepository,
} from "../domain/review.repository";
import { mapReviewRow } from "./review.mapper";

function pct(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

export class SupabaseReviewRepository implements ReviewRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async list(query: ListReviewsQuery): Promise<Result<Paginated<Review>, AppError>> {
    const { from, to, page, pageSize } = toRange(query);
    let q = this.db
      .from("reviews")
      .select("*", { count: "exact" })
      .eq("business_id", query.businessId);

    if (query.filter === "needs_reply") q = q.neq("reply_status", "posted");
    if (query.filter === "negative") q = q.lte("rating", 2);

    const { data, error, count } = await q
      .order("review_created_at", { ascending: false, nullsFirst: false })
      .range(from, to);
    if (error) return err(new InternalError("Could not load reviews.", error));
    return ok(paginate(data.map(mapReviewRow), count ?? 0, page, pageSize));
  }

  async findById(businessId: string, id: string): Promise<Result<Review | null, AppError>> {
    const { data, error } = await this.db
      .from("reviews")
      .select("*")
      .eq("business_id", businessId)
      .eq("id", id)
      .maybeSingle();
    if (error) return err(new InternalError("Could not load review.", error));
    return ok(data ? mapReviewRow(data) : null);
  }

  async saveReply(
    businessId: string,
    reviewId: string,
    replyText: string,
    status: ReplyStatus,
  ): Promise<Result<Review, AppError>> {
    const { data, error } = await this.db
      .from("reviews")
      .update({ reply_text: replyText, reply_status: status })
      .eq("business_id", businessId)
      .eq("id", reviewId)
      .select("*")
      .single();
    if (error) return err(new InternalError("Could not save reply.", error));
    if (!data) return err(new NotFoundError("Review not found."));
    return ok(mapReviewRow(data));
  }

  async recent(businessId: string, limit: number): Promise<Result<Review[], AppError>> {
    const { data, error } = await this.db
      .from("reviews")
      .select("*")
      .eq("business_id", businessId)
      .order("review_created_at", { ascending: false, nullsFirst: false })
      .limit(limit);
    if (error) return err(new InternalError("Could not load recent reviews.", error));
    return ok(data.map(mapReviewRow));
  }

  async metrics(businessId: string): Promise<Result<DashboardMetrics, AppError>> {
    const { data, error } = await this.db.rpc("dashboard_metrics", { p_business: businessId });
    if (error) return err(new InternalError("Could not load metrics.", error));

    const m = (data ?? {}) as Record<string, number>;
    const total = Number(m.total ?? 0);
    const replied = Number(m.replied ?? 0);
    const newThisWeek = Number(m.new_this_week ?? 0);
    const prevWeek = Number(m.prev_week ?? 0);

    // Rating trend: a running average over the most recent reviews (asc).
    const trendRes = await this.db
      .from("reviews")
      .select("rating")
      .eq("business_id", businessId)
      .order("review_created_at", { ascending: true, nullsFirst: false })
      .limit(50);
    const ratings = (trendRes.data ?? []).map((r) => r.rating);
    const ratingTrend: number[] = [];
    let runningSum = 0;
    ratings.forEach((r, i) => {
      runningSum += r;
      ratingTrend.push(Number((runningSum / (i + 1)).toFixed(2)));
    });

    return ok({
      avgRating: Number(m.avg_rating ?? 0),
      totalReviews: total,
      responseRate: pct(replied, total),
      newThisWeek,
      deltas: {
        rating: 0,
        reviews: prevWeek === 0 ? newThisWeek : pct(newThisWeek - prevWeek, prevWeek),
        response: 0,
        week: prevWeek === 0 ? 0 : pct(newThisWeek - prevWeek, prevWeek),
      },
      ratingTrend,
    });
  }
}
