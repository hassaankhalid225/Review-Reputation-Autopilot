/** Presentation-safe shape for alerts. */
import type { Alert } from "../domain/alert.entity";

export interface AlertView {
  id: string;
  type: string;
  acknowledged: boolean;
  createdAt: string | null;
  reviewRating: number | null;
  reviewText: string | null;
  reviewAuthor: string | null;
}

export function toAlertView(a: Alert): AlertView {
  const p = a.toJSON();
  return {
    id: p.id,
    type: p.type,
    acknowledged: a.isAcknowledged,
    createdAt: p.createdAt,
    reviewRating: p.reviewRating,
    reviewText: p.reviewText,
    reviewAuthor: p.reviewAuthor,
  };
}
