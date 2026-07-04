/** Maps `review_sources` rows to the ReviewSource domain entity. */
import type { Database } from "@/network/supabase/types";
import { ReviewSource } from "../domain/review-source.entity";

/** The row shape we read — credentials are never selected (revoked from clients). */
type Row = Omit<Database["public"]["Tables"]["review_sources"]["Row"], "credentials_encrypted">;

export function toReviewSource(row: Row): ReviewSource {
  return ReviewSource.fromProps({
    id: row.id,
    businessId: row.business_id,
    platform: row.platform,
    externalId: row.external_id,
    displayName: row.display_name,
    reviewLink: row.review_link,
    profileUrl: row.profile_url,
    avgRating: row.avg_rating,
    reviewCount: row.review_count ?? 0,
    status: row.status ?? "connected",
    lastSyncedAt: row.last_synced_at,
    createdAt: row.created_at,
  });
}
