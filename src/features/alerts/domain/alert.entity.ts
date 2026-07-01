/**
 * Domain entity: Alert (SRS §5.2.9) — an owner-facing notification, currently
 * "bad_review". Carries enough denormalized review context for the inbox UI.
 */
export interface AlertProps {
  id: string;
  businessId: string;
  reviewId: string | null;
  type: string;
  channel: string;
  sentAt: string | null;
  acknowledgedAt: string | null;
  createdAt: string | null;
  // Denormalized review preview (joined for the inbox).
  reviewRating: number | null;
  reviewText: string | null;
  reviewAuthor: string | null;
}

export class Alert {
  private constructor(private readonly props: AlertProps) {}

  static fromProps(props: AlertProps): Alert {
    return new Alert(props);
  }

  get id(): string {
    return this.props.id;
  }
  get isAcknowledged(): boolean {
    return this.props.acknowledgedAt !== null;
  }

  toJSON(): AlertProps {
    return { ...this.props };
  }
}
