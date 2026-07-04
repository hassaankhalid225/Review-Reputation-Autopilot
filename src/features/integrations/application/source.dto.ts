/** Serializable view of a connected review source for the UI. */
import type { Platform, SourceStatus } from "@/network/supabase/types";
import type { ReviewSource } from "../domain/review-source.entity";

export interface ReviewSourceView {
  id: string;
  platform: Platform;
  displayName: string | null;
  reviewLink: string | null;
  profileUrl: string | null;
  avgRating: number | null;
  reviewCount: number;
  status: SourceStatus;
  lastSyncedAt: string | null;
}

export function toReviewSourceView(source: ReviewSource): ReviewSourceView {
  const p = source.toJSON();
  return {
    id: p.id,
    platform: p.platform,
    displayName: p.displayName,
    reviewLink: p.reviewLink,
    profileUrl: p.profileUrl,
    avgRating: p.avgRating,
    reviewCount: p.reviewCount,
    status: p.status,
    lastSyncedAt: p.lastSyncedAt,
  };
}
