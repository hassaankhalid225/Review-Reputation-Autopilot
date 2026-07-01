/** Presentation-safe shapes for review requests. */
import type { ReviewRequest } from "../domain/review-request.entity";

export interface RequestView {
  id: string;
  status: string;
  shortToken: string | null;
  createdAt: string | null;
}

export function toRequestView(r: ReviewRequest): RequestView {
  const p = r.toJSON();
  return { id: p.id, status: p.status, shortToken: p.shortToken, createdAt: p.createdAt };
}
