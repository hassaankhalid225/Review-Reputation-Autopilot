/**
 * Use case: send a review request to a customer.
 *
 * Orchestrates the policy: customer exists → has consent → not within the
 * anti-spam cooldown → a Google location is connected. Then it builds the short
 * link, persists a queued request, and dispatches via the MessageSender port.
 * If no sender is configured the request stays queued (an edge function/cron
 * drains the queue once WhatsApp/Twilio is wired) — nothing is lost.
 */
import { Result, err, ok } from "@/core/result/result";
import { type AppError, NotFoundError, ProviderError, ValidationError } from "@/core/errors/app-error";
import type { AuditLogger } from "@/core/audit/audit-logger";
import { REQUEST_COOLDOWN_DAYS } from "@/core/config/constants";
import { clientConfig } from "@/core/config/env";
import { shortToken, uuid } from "@/shared/lib/id";
import type { CustomerRepository } from "@/features/customers/domain/customer.repository";
import { ConsentRequiredError } from "@/features/customers/domain/customer.errors";
import type { ReviewRequestRepository } from "../domain/review-request.repository";
import type { MessageSender } from "../domain/message-sender";
import { type RequestView, toRequestView } from "./request.dto";

export interface SendRequestInput {
  businessId: string;
  customerId: string;
  /** ISO timestamp "now", supplied by the caller (keeps the use case pure). */
  now: string;
}

function messageBody(businessName: string, link: string): string {
  return `Hi! Thanks for choosing ${businessName}. We'd love a quick Google review — it only takes 30 seconds: ${link}`;
}

export class SendRequestUseCase {
  constructor(
    private readonly requests: ReviewRequestRepository,
    private readonly customers: CustomerRepository,
    private readonly sender: MessageSender,
    private readonly audit: AuditLogger,
  ) {}

  async execute(
    actorId: string,
    input: SendRequestInput,
    businessName = "us",
  ): Promise<Result<RequestView, AppError>> {
    const customerRes = await this.customers.findById(input.businessId, input.customerId);
    if (customerRes.isErr()) return err(customerRes.error);
    const customer = customerRes.value;
    if (!customer) return err(new NotFoundError("Customer not found."));
    if (!customer.canReceiveRequests()) return err(new ConsentRequiredError());

    // Anti-spam cooldown (REQUEST_COOLDOWN_DAYS).
    const since = new Date(Date.parse(input.now) - REQUEST_COOLDOWN_DAYS * 86_400_000).toISOString();
    const recent = await this.requests.wasRequestedSince(input.businessId, input.customerId, since);
    if (recent.isErr()) return err(recent.error);
    if (recent.value) {
      return err(
        new ValidationError(`You already messaged this customer in the last ${REQUEST_COOLDOWN_DAYS} days.`),
      );
    }

    const locationRes = await this.requests.primaryLocation(input.businessId);
    if (locationRes.isErr()) return err(locationRes.error);
    const location = locationRes.value;
    if (!location || !location.reviewLink) {
      return err(new ValidationError("Connect your Google Business Profile before sending requests."));
    }

    const token = shortToken();
    const created = await this.requests.create({
      businessId: input.businessId,
      customerId: input.customerId,
      locationId: location.locationId,
      channel: "whatsapp",
      shortToken: token,
      idempotencyKey: uuid(),
    });
    if (created.isErr()) return err(created.error);
    const request = created.value;

    await this.customers.markRequested(input.businessId, input.customerId, input.now);

    // Dispatch now if a sender is configured; otherwise leave queued for the drainer.
    if (this.sender.isConfigured()) {
      const link = `${clientConfig.NEXT_PUBLIC_APP_URL}/r/${token}`;
      const sent = await this.sender.send({
        to: customer.phone,
        body: messageBody(businessName, link),
        channel: "whatsapp",
      });
      if (sent.isErr()) {
        await this.requests.markStatus(request.id, "failed", { error: sent.error.message });
        return err(new ProviderError("We couldn't send the message. Please try again."));
      }
      await this.requests.markStatus(request.id, "sent", { providerMessageId: sent.value.providerMessageId });
    }

    await this.audit.record({
      businessId: input.businessId,
      actorId,
      action: "request.created",
      entity: "review_request",
      entityId: request.id,
      metadata: { queued: !this.sender.isConfigured() },
    });

    return ok(toRequestView(request));
  }
}
