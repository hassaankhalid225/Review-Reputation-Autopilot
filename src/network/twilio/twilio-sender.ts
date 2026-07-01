/**
 * ADAPTER: TwilioSmsSender — implements MessageSender via Twilio's SMS API.
 * The SMS fallback behind the same MessageSender port as WhatsApp.
 */
import "server-only";
import { Result, ok, err } from "@/core/result/result";
import { type AppError, ProviderError } from "@/core/errors/app-error";
import { getServerConfig } from "@/core/config/env";
import { httpRequest } from "@/network/http/fetch";
import { logger } from "@/core/logger/logger";
import type { MessageSender, OutboundMessage, SendResult } from "@/features/review-requests/domain/message-sender";

export class TwilioSmsSender implements MessageSender {
  isConfigured(): boolean {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM } = getServerConfig();
    return Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM);
  }

  async send(message: OutboundMessage): Promise<Result<SendResult, AppError>> {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM } = getServerConfig();
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) {
      return err(new ProviderError("SMS is not configured."));
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
    const form = new URLSearchParams({ From: TWILIO_FROM, To: message.to, Body: message.body });

    try {
      const res = await httpRequest(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      });
      const data = (await res.json()) as { sid?: string; message?: string };
      if (!res.ok || !data.sid) {
        logger.warn("twilio.send_failed", { status: res.status, error: data.message });
        return err(new ProviderError(data.message ?? "SMS send failed."));
      }
      return ok({ providerMessageId: data.sid });
    } catch (e) {
      logger.error("twilio.send_error", { error: String(e) });
      return err(new ProviderError("SMS request failed."));
    }
  }
}
