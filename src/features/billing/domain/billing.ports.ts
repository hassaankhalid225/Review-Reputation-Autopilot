/** PORTS for the billing feature: persistence, usage, and the payment gateway. */
import type { Result } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { PlanId } from "@/core/config/constants";
import type { Subscription, SubscriptionStatus } from "./subscription.entity";

export interface UsageSnapshot {
  requestsSent: number;
  aiReplies: number;
}

export interface SubscriptionRepository {
  getForBusiness(businessId: string): Promise<Result<Subscription | null, AppError>>;
  /** Upsert plan/status from a payment-provider event (service scope). */
  applyUpdate(
    businessId: string,
    patch: {
      plan?: PlanId;
      status?: SubscriptionStatus;
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
      currentPeriodEnd?: string | null;
    },
  ): Promise<Result<void, AppError>>;
}

export interface UsageRepository {
  /** Counters for the current billing month (zeros if none yet). */
  getCurrentMonth(businessId: string): Promise<Result<UsageSnapshot, AppError>>;
}

export interface ManualPaymentRepository {
  submit(businessId: string, plan: PlanId, amount: number, currency: string): Promise<Result<void, AppError>>;
}

/** PORT: PaymentGateway (ARCHITECTURE §6.4). Default StripeGateway. */
export interface CheckoutRequest {
  businessId: string;
  plan: Exclude<PlanId, "trial">;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
}

export interface WebhookEvent {
  type: string;
  businessId: string | null;
  plan: PlanId | null;
  status: SubscriptionStatus | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: string | null;
}

export interface PaymentGateway {
  isConfigured(): boolean;
  createCheckout(request: CheckoutRequest): Promise<Result<{ url: string }, AppError>>;
  /** Verify signature and normalize a provider webhook into a domain event. */
  parseWebhook(payload: string, signature: string | null): Promise<Result<WebhookEvent | null, AppError>>;
}
