/**
 * ADAPTER: ResendEmailSender — implements MessageSender via the Resend email API.
 * The "email" channel for review requests (ARCHITECTURE §6.4). Configured with
 * RESEND_API_KEY + a verified EMAIL_FROM address; otherwise reports unconfigured
 * so requests stay queued (nothing is lost).
 */
import "server-only";
import { Result, ok, err } from "@/core/result/result";
import { type AppError, ProviderError } from "@/core/errors/app-error";
import { getServerConfig } from "@/core/config/env";
import { httpRequest } from "@/network/http/fetch";
import { logger } from "@/core/logger/logger";
import type { MessageSender, OutboundMessage, SendResult } from "@/features/review-requests/domain/message-sender";

export class ResendEmailSender implements MessageSender {
  isConfigured(): boolean {
    const { RESEND_API_KEY, EMAIL_FROM } = getServerConfig();
    return Boolean(RESEND_API_KEY && EMAIL_FROM);
  }

  async send(message: OutboundMessage): Promise<Result<SendResult, AppError>> {
    const { RESEND_API_KEY, EMAIL_FROM } = getServerConfig();
    if (!RESEND_API_KEY || !EMAIL_FROM) {
      return err(new ProviderError("Email is not configured."));
    }

    try {
      const res = await httpRequest("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: [message.to],
          subject: message.subject ?? "We'd love your feedback",
          text: message.body,
        }),
      });
      const data = (await res.json()) as { id?: string; message?: string };
      if (!res.ok || !data.id) {
        logger.warn("email.send_failed", { status: res.status, error: data.message });
        return err(new ProviderError(data.message ?? "Email send failed."));
      }
      return ok({ providerMessageId: data.id });
    } catch (e) {
      logger.error("email.send_error", { error: String(e) });
      return err(new ProviderError("Email request failed."));
    }
  }
}
