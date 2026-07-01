/**
 * Domain entity: ReviewRequest (SRS §5.2.6) — an outbound ask for a review,
 * sent over WhatsApp/SMS, tracked through a delivery lifecycle.
 */
export type RequestChannel = "whatsapp" | "sms";
export type RequestStatus = "queued" | "sent" | "delivered" | "clicked" | "reviewed" | "failed";

export interface ReviewRequestProps {
  id: string;
  businessId: string;
  customerId: string;
  locationId: string | null;
  channel: RequestChannel;
  status: RequestStatus;
  shortToken: string | null;
  providerMessageId: string | null;
  error: string | null;
  sentAt: string | null;
  clickedAt: string | null;
  createdAt: string | null;
}

export class ReviewRequest {
  private constructor(private readonly props: ReviewRequestProps) {}

  static fromProps(props: ReviewRequestProps): ReviewRequest {
    return new ReviewRequest(props);
  }

  get id(): string {
    return this.props.id;
  }
  get status(): RequestStatus {
    return this.props.status;
  }
  get shortToken(): string | null {
    return this.props.shortToken;
  }
  get customerId(): string {
    return this.props.customerId;
  }

  toJSON(): ReviewRequestProps {
    return { ...this.props };
  }
}
