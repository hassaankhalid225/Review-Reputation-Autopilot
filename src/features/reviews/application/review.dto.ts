/** Presentation-safe shapes for the reviews feature. */
import type { Review, ReplyStatus } from "../domain/review.entity";

export interface ReviewView {
  id: string;
  rating: number;
  text: string | null;
  authorName: string;
  replyText: string | null;
  replyStatus: ReplyStatus;
  isNegative: boolean;
  createdAt: string | null;
}

export function toReviewView(r: Review): ReviewView {
  const p = r.toJSON();
  return {
    id: p.id,
    rating: p.rating,
    text: p.text,
    authorName: p.authorName?.trim() || "Anonymous",
    replyText: p.replyText,
    replyStatus: p.replyStatus,
    isNegative: r.isNegative,
    createdAt: p.reviewCreatedAt ?? p.ingestedAt,
  };
}
