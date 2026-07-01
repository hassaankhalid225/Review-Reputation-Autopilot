/**
 * ADAPTER: NullMessageSender — the default MessageSender until WhatsApp/Twilio
 * credentials are configured. Reports "not configured" so requests are enqueued
 * (status `queued`) rather than dropped. Swap for WhatsAppSender in the DI
 * registry once WHATSAPP_TOKEN / TWILIO_* env is set.
 */
import { Result, err } from "@/core/result/result";
import { type AppError, ProviderError } from "@/core/errors/app-error";
import type { MessageSender, SendResult } from "../domain/message-sender";

export class NullMessageSender implements MessageSender {
  isConfigured(): boolean {
    return false;
  }
  async send(): Promise<Result<SendResult, AppError>> {
    return err(new ProviderError("No messaging provider configured."));
  }
}
