/**
 * ADAPTER: SupabaseReviewIngestionRepository — upserts reviews pulled from a
 * platform into the unified `reviews` feed. The platform's review id is stored
 * (namespaced by platform) in the unique `google_review_id` column, and `source`
 * records which platform it came from, so multi-platform reviews coexist.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { Result, ok, err } from "@/core/result/result";
import { type AppError, InternalError } from "@/core/errors/app-error";
import type { Database } from "@/network/supabase/types";
import type { Platform } from "../domain/platform";
import type { NormalizedReview, ReviewIngestionRepository } from "../domain/integrations.ports";

export class SupabaseReviewIngestionRepository implements ReviewIngestionRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async upsertMany(
    businessId: string,
    platform: Platform,
    reviews: NormalizedReview[],
  ): Promise<Result<number, AppError>> {
    const rows = reviews
      .filter((r) => r.rating >= 1 && r.rating <= 5)
      .map((r) => ({
        business_id: businessId,
        source: platform,
        google_review_id: `${platform}:${r.externalId}`,
        rating: r.rating,
        text: r.text,
        author_name: r.authorName,
        review_created_at: r.createdAt,
      }));
    if (rows.length === 0) return ok(0);

    const { error } = await this.db
      .from("reviews")
      .upsert(rows, { onConflict: "business_id,google_review_id", ignoreDuplicates: false });
    if (error) return err(new InternalError("Could not ingest reviews.", error));
    return ok(rows.length);
  }
}
