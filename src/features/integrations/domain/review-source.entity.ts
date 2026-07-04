/**
 * Domain entity: ReviewSource — a connected place customers review a business
 * (one per platform). Framework-free; the repository maps rows to/from this.
 */
import type { Platform, SourceStatus } from "./platform";

export interface ReviewSourceProps {
  id: string;
  businessId: string;
  platform: Platform;
  externalId: string | null;
  displayName: string | null;
  reviewLink: string | null;
  profileUrl: string | null;
  avgRating: number | null;
  reviewCount: number;
  status: SourceStatus;
  lastSyncedAt: string | null;
  createdAt: string | null;
}

export class ReviewSource {
  private constructor(private readonly props: ReviewSourceProps) {}

  static fromProps(props: ReviewSourceProps): ReviewSource {
    return new ReviewSource(props);
  }

  get id(): string {
    return this.props.id;
  }
  get platform(): Platform {
    return this.props.platform;
  }
  get isConnected(): boolean {
    return this.props.status === "connected";
  }
  get needsAttention(): boolean {
    return this.props.status === "revoked" || this.props.status === "error";
  }

  toJSON(): ReviewSourceProps {
    return { ...this.props };
  }
}
