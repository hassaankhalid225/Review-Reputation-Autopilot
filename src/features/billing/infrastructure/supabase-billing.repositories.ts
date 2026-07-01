/**
 * ADAPTERS for billing persistence: subscription, usage, manual payments.
 * The webhook-driven applyUpdate runs in the service scope (no session).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { Result, ok, err } from "@/core/result/result";
import { type AppError, InternalError } from "@/core/errors/app-error";
import type { PlanId } from "@/core/config/constants";
import type { Database, PlanTier } from "@/network/supabase/types";
import { Subscription } from "../domain/subscription.entity";
import type {
  ManualPaymentRepository,
  SubscriptionRepository,
  UsageRepository,
  UsageSnapshot,
} from "../domain/billing.ports";
import type { SubscriptionStatus } from "../domain/subscription.entity";

function currentPeriodMonth(): string {
  // First day of the current month (matches usage_counters.period_month: date).
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export class SupabaseSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async getForBusiness(businessId: string): Promise<Result<Subscription | null, AppError>> {
    const { data, error } = await this.db
      .from("subscriptions")
      .select("*")
      .eq("business_id", businessId)
      .maybeSingle();
    if (error) return err(new InternalError("Could not load subscription.", error));
    if (!data) return ok(null);
    return ok(
      Subscription.fromProps({
        businessId: data.business_id,
        plan: data.plan as PlanId,
        status: data.status as SubscriptionStatus,
        provider: data.provider ?? "stripe",
        stripeCustomerId: data.stripe_customer_id,
        stripeSubscriptionId: data.stripe_subscription_id,
        trialEndsAt: data.trial_ends_at,
        currentPeriodEnd: data.current_period_end,
      }),
    );
  }

  async applyUpdate(
    businessId: string,
    patch: {
      plan?: PlanId;
      status?: SubscriptionStatus;
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
      currentPeriodEnd?: string | null;
    },
  ): Promise<Result<void, AppError>> {
    const { error } = await this.db
      .from("subscriptions")
      .update({
        ...(patch.plan ? { plan: patch.plan as PlanTier } : {}),
        ...(patch.status ? { status: patch.status } : {}),
        ...(patch.stripeCustomerId !== undefined ? { stripe_customer_id: patch.stripeCustomerId } : {}),
        ...(patch.stripeSubscriptionId !== undefined
          ? { stripe_subscription_id: patch.stripeSubscriptionId }
          : {}),
        ...(patch.currentPeriodEnd !== undefined ? { current_period_end: patch.currentPeriodEnd } : {}),
        provider: "stripe",
      })
      .eq("business_id", businessId);
    if (error) return err(new InternalError("Could not update subscription.", error));
    return ok(undefined);
  }
}

export class SupabaseUsageRepository implements UsageRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async getCurrentMonth(businessId: string): Promise<Result<UsageSnapshot, AppError>> {
    const { data, error } = await this.db
      .from("usage_counters")
      .select("requests_sent, ai_replies")
      .eq("business_id", businessId)
      .eq("period_month", currentPeriodMonth())
      .maybeSingle();
    if (error) return err(new InternalError("Could not load usage.", error));
    return ok({ requestsSent: data?.requests_sent ?? 0, aiReplies: data?.ai_replies ?? 0 });
  }
}

export class SupabaseManualPaymentRepository implements ManualPaymentRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async submit(
    businessId: string,
    plan: PlanId,
    amount: number,
    currency: string,
  ): Promise<Result<void, AppError>> {
    const { error } = await this.db.from("manual_payments").insert({
      business_id: businessId,
      plan,
      amount,
      currency,
      status: "pending",
    });
    if (error) return err(new InternalError("Could not submit payment request.", error));
    // Mark the subscription as awaiting manual approval.
    await this.db
      .from("subscriptions")
      .update({ status: "manual_pending", provider: "manual" })
      .eq("business_id", businessId);
    return ok(undefined);
  }
}
