/**
 * ADAPTER: WhatsAppSender — implements MessageSender via the WhatsApp Cloud API.
 * Default outbound channel for review requests (ARCHITECTURE §6.4).
 */
import "server-only";
import { Result, ok, err } from "@/core/result/result";
import { type AppError, ProviderError } from "@/core/errors/app-error";
import { getServerConfig } from "@/core/config/env";
import { httpRequest } from "@/network/http/fetch";
import { logger } from "@/core/logger/logger";
import type { MessageSender, OutboundMessage, SendResult } from "@/features/review-requests/domain/message-sender";

const GRAPH_VERSION = "v21.0";

export class WhatsAppSender implements MessageSender {
  isConfigured(): boolean {
    const { WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID } = getServerConfig();
    return Boolean(WHATSAPP_TOKEN && WHATSAPP_PHONE_NUMBER_ID);
  }

  async send(message: OutboundMessage): Promise<Result<SendResult, AppError>> {
    const { WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID } = getServerConfig();
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      return err(new ProviderError("WhatsApp is not configured."));
    }

    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    try {
      const res = await httpRequest(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: message.to.replace(/^\+/, ""),
          type: "text",
          text: { preview_url: true, body: message.body },
        }),
      });
      const data = (await res.json()) as { messages?: { id: string }[]; error?: { message: string } };
      if (!res.ok || !data.messages?.[0]) {
        logger.warn("whatsapp.send_failed", { status: res.status, error: data.error?.message });
        return err(new ProviderError(data.error?.message ?? "WhatsApp send failed."));
      }
      return ok({ providerMessageId: data.messages[0].id });
    } catch (e) {
      logger.error("whatsapp.send_error", { error: String(e) });
      return err(new ProviderError("WhatsApp request failed."));
    }
  }
}
