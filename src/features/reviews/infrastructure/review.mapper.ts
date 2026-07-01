/** Maps a `reviews` DB row ⇄ the Review domain entity. */
import type { Tables } from "@/network/supabase/types";
import { Review, type ReplyStatus } from "../domain/review.entity";

export function mapReviewRow(row: Tables<"reviews">): Review {
  return Review.fromProps({
    id: row.id,
    businessId: row.business_id,
    locationId: row.location_id,
    source: row.source ?? "google",
    googleReviewId: row.google_review_id,
    rating: row.rating,
    text: row.text,
    authorName: row.author_name,
    replyText: row.reply_text,
    replyStatus: (row.reply_status ?? "none") as ReplyStatus,
    reviewCreatedAt: row.review_created_at,
    ingestedAt: row.ingested_at,
  });
}
