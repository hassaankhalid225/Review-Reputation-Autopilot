/**
 * Domain entity: Review (SRS §5.2.7) — a Google review ingested for a business,
 * with optional AI-drafted/posted reply state.
 */
export type ReplyStatus = "none" | "drafted" | "posted" | "failed";

export interface ReviewProps {
  id: string;
  businessId: string;
  locationId: string | null;
  source: string;
  googleReviewId: string;
  rating: number;
  text: string | null;
  authorName: string | null;
  replyText: string | null;
  replyStatus: ReplyStatus;
  reviewCreatedAt: string | null;
  ingestedAt: string | null;
}

export class Review {
  private constructor(private readonly props: ReviewProps) {}

  static fromProps(props: ReviewProps): Review {
    return new Review(props);
  }

  get id(): string {
    return this.props.id;
  }
  get rating(): number {
    return this.props.rating;
  }
  get replyStatus(): ReplyStatus {
    return this.props.replyStatus;
  }
  get isNegative(): boolean {
    return this.props.rating <= 2;
  }
  get isReplied(): boolean {
    return this.props.replyStatus === "posted";
  }

  toJSON(): ReviewProps {
    return { ...this.props };
  }
}
