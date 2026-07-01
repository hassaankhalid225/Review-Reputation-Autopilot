/**
 * ADAPTER: StripeGateway — implements PaymentGateway over the Stripe REST API
 * (raw HTTP; no SDK dependency, edge-compatible). Creates Checkout Sessions with
 * inline price_data (no pre-created Price IDs needed) and verifies webhooks with
 * Web Crypto HMAC-SHA256, matching Stripe's `t=...,v1=...` signature scheme.
 */
import "server-only";
import { Result, ok, err } from "@/core/result/result";
import { type AppError, ProviderError, ValidationError } from "@/core/errors/app-error";
import { getServerConfig } from "@/core/config/env";
import { PLANS, type PlanId } from "@/core/config/constants";
import { httpRequest } from "@/network/http/fetch";
import { logger } from "@/core/logger/logger";
import type { CheckoutRequest, PaymentGateway, WebhookEvent } from "@/features/billing/domain/billing.ports";
import type { SubscriptionStatus } from "@/features/billing/domain/subscription.entity";

const STRIPE_API = "https://api.stripe.com/v1";
const SIGNATURE_TOLERANCE_S = 300;

export class StripeGateway implements PaymentGateway {
  isConfigured(): boolean {
    return Boolean(getServerConfig().STRIPE_SECRET_KEY);
  }

  async createCheckout(request: CheckoutRequest): Promise<Result<{ url: string }, AppError>> {
    const { STRIPE_SECRET_KEY } = getServerConfig();
    if (!STRIPE_SECRET_KEY) return err(new ProviderError("Stripe is not configured."));

    const plan = PLANS[request.plan];
    const form = new URLSearchParams({
      mode: "subscription",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(plan.priceUsd),
      "line_items[0][price_data][recurring][interval]": "month",
      "line_items[0][price_data][product_data][name]": `Reputation Autopilot — ${plan.name}`,
      customer_email: request.customerEmail,
      success_url: request.successUrl,
      cancel_url: request.cancelUrl,
      "metadata[business_id]": request.businessId,
      "metadata[plan]": request.plan,
      "subscription_data[metadata][business_id]": request.businessId,
      "subscription_data[metadata][plan]": request.plan,
    });

    try {
      const res = await httpRequest(`${STRIPE_API}/checkout/sessions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      });
      const data = (await res.json()) as { url?: string; error?: { message: string } };
      if (!res.ok || !data.url) {
        logger.warn("stripe.checkout_failed", { status: res.status, error: data.error?.message });
        return err(new ProviderError(data.error?.message ?? "Could not start checkout."));
      }
      return ok({ url: data.url });
    } catch (e) {
      logger.error("stripe.checkout_error", { error: String(e) });
      return err(new ProviderError("Checkout request failed."));
    }
  }

  async parseWebhook(payload: string, signature: string | null): Promise<Result<WebhookEvent | null, AppError>> {
    const { STRIPE_WEBHOOK_SECRET } = getServerConfig();
    if (!STRIPE_WEBHOOK_SECRET) return err(new ProviderError("Webhook secret not configured."));
    if (!signature) return err(new ValidationError("Missing signature."));

    const verified = await verifyStripeSignature(payload, signature, STRIPE_WEBHOOK_SECRET);
    if (!verified) return err(new ValidationError("Invalid webhook signature."));

    const event = JSON.parse(payload) as StripeEvent;
    const obj = event.data?.object ?? {};
    const meta = obj.metadata ?? obj.subscription_details?.metadata ?? {};
    const businessId = meta.business_id ?? null;
    const plan = (meta.plan as PlanId | undefined) ?? null;

    const statusByType: Record<string, SubscriptionStatus | undefined> = {
      "checkout.session.completed": "active",
      "customer.subscription.updated": mapStripeStatus(obj.status),
      "customer.subscription.deleted": "canceled",
      "invoice.payment_failed": "past_due",
    };
    const status = statusByType[event.type];
    if (status === undefined && !(event.type in statusByType)) {
      return ok(null); // event type we don't care about
    }

    return ok({
      type: event.type,
      businessId,
      plan,
      status: status ?? null,
      stripeCustomerId: typeof obj.customer === "string" ? obj.customer : null,
      stripeSubscriptionId:
        typeof obj.subscription === "string" ? obj.subscription : typeof obj.id === "string" ? obj.id : null,
      currentPeriodEnd: obj.current_period_end
        ? new Date(obj.current_period_end * 1000).toISOString()
        : null,
    });
  }
}

function mapStripeStatus(s: string | undefined): SubscriptionStatus | undefined {
  if (s === "active" || s === "trialing") return "active";
  if (s === "past_due" || s === "unpaid") return "past_due";
  if (s === "canceled") return "canceled";
  return undefined;
}

/** Verify Stripe's `t=...,v1=...` signature header with HMAC-SHA256. */
async function verifyStripeSignature(payload: string, header: string, secret: string): Promise<boolean> {
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  const timestamp = parts.t;
  const expected = parts.v1;
  if (!timestamp || !expected) return false;

  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (Number.isNaN(age) || age > SIGNATURE_TOLERANCE_S) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const computed = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return timingSafeEqual(computed, expected);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

interface StripeEvent {
  type: string;
  data?: {
    object?: {
      id?: string;
      customer?: string;
      subscription?: string;
      status?: string;
      current_period_end?: number;
      metadata?: Record<string, string>;
      subscription_details?: { metadata?: Record<string, string> };
    };
  };
}
