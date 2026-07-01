/** Application layer: billing use cases. */
import { Result, err, ok } from "@/core/result/result";
import { type AppError, ValidationError } from "@/core/errors/app-error";
import type { AuditLogger } from "@/core/audit/audit-logger";
import { PLANS, type PlanId } from "@/core/config/constants";
import type { SubscriptionStatus } from "../domain/subscription.entity";
import type {
  CheckoutRequest,
  ManualPaymentRepository,
  PaymentGateway,
  SubscriptionRepository,
  UsageRepository,
} from "../domain/billing.ports";

export interface BillingOverview {
  plan: PlanId;
  status: SubscriptionStatus;
  trialDaysLeft: number;
  trialTotalDays: number;
  usage: { requestsSent: number; aiReplies: number };
  limits: { requestsPerMonth: number; aiRepliesPerMonth: number };
  paymentsEnabled: boolean;
}

export class GetBillingOverviewUseCase {
  constructor(
    private readonly subs: SubscriptionRepository,
    private readonly usage: UsageRepository,
    private readonly gateway: PaymentGateway,
  ) {}

  async execute(businessId: string, now: number): Promise<Result<BillingOverview, AppError>> {
    const subRes = await this.subs.getForBusiness(businessId);
    if (subRes.isErr()) return err(subRes.error);
    const usageRes = await this.usage.getCurrentMonth(businessId);
    if (usageRes.isErr()) return err(usageRes.error);

    const sub = subRes.value;
    const plan: PlanId = sub?.plan ?? "trial";
    const limits = PLANS[plan];

    return ok({
      plan,
      status: sub?.status ?? "trialing",
      trialDaysLeft: sub?.trialDaysLeft(now) ?? 0,
      trialTotalDays: PLANS.trial.trialDays,
      usage: usageRes.value,
      limits: {
        requestsPerMonth: limits.requestsPerMonth,
        aiRepliesPerMonth: limits.aiRepliesPerMonth,
      },
      paymentsEnabled: this.gateway.isConfigured(),
    });
  }
}

export class CreateCheckoutUseCase {
  constructor(private readonly gateway: PaymentGateway) {}

  async execute(request: CheckoutRequest): Promise<Result<{ url: string }, AppError>> {
    if (request.plan !== "starter" && request.plan !== "pro") {
      return err(new ValidationError("Choose a paid plan."));
    }
    if (!this.gateway.isConfigured()) {
      return err(new ValidationError("Online payments aren't enabled yet."));
    }
    return this.gateway.createCheckout(request);
  }
}

export class SubmitManualPaymentUseCase {
  constructor(
    private readonly repo: ManualPaymentRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(actorId: string, businessId: string, plan: PlanId): Promise<Result<void, AppError>> {
    if (plan !== "starter" && plan !== "pro") return err(new ValidationError("Choose a paid plan."));
    const def = PLANS[plan];
    const result = await this.repo.submit(businessId, plan, def.priceLocal, "PKR");
    if (result.isOk()) {
      await this.audit.record({
        businessId,
        actorId,
        action: "billing.manual_payment_submitted",
        entity: "subscription",
        metadata: { plan },
      });
    }
    return result;
  }
}

export class HandleWebhookUseCase {
  constructor(
    private readonly gateway: PaymentGateway,
    private readonly subs: SubscriptionRepository,
  ) {}

  async execute(payload: string, signature: string | null): Promise<Result<void, AppError>> {
    const parsed = await this.gateway.parseWebhook(payload, signature);
    if (parsed.isErr()) return err(parsed.error);
    const event = parsed.value;
    if (!event || !event.businessId) return ok(undefined); // ignored event type

    return this.subs.applyUpdate(event.businessId, {
      plan: event.plan ?? undefined,
      status: event.status ?? undefined,
      stripeCustomerId: event.stripeCustomerId,
      stripeSubscriptionId: event.stripeSubscriptionId,
      currentPeriodEnd: event.currentPeriodEnd,
    });
  }
}
