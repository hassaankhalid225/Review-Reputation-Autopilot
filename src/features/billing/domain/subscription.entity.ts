/**
 * Domain entity: Subscription (SRS §5.2.10). One per business; tracks plan,
 * status, trial window, and the Stripe linkage.
 */
import type { PlanId } from "@/core/config/constants";

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "manual_pending";

export interface SubscriptionProps {
  businessId: string;
  plan: PlanId;
  status: SubscriptionStatus;
  provider: "stripe" | "manual";
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
}

export class Subscription {
  private constructor(private readonly props: SubscriptionProps) {}

  static fromProps(props: SubscriptionProps): Subscription {
    return new Subscription(props);
  }

  get plan(): PlanId {
    return this.props.plan;
  }
  get status(): SubscriptionStatus {
    return this.props.status;
  }
  get isTrialing(): boolean {
    return this.props.status === "trialing";
  }

  /** Whole days left in the trial (0 if not trialing or expired). */
  trialDaysLeft(now: number): number {
    if (!this.props.trialEndsAt) return 0;
    const ms = Date.parse(this.props.trialEndsAt) - now;
    return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000);
  }

  toJSON(): SubscriptionProps {
    return { ...this.props };
  }
}
