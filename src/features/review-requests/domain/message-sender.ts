/**
 * PORT: MessageSender (ARCHITECTURE §6.4). Default adapter WhatsAppSender;
 * swappable with TwilioSmsSender or a fake in tests. Consumers depend on this
 * interface so adding an SMS fallback is an infrastructure-only change.
 */
import type { Result } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";

export interface OutboundMessage {
  to: string; // E.164 phone, or an email address for the email channel
  body: string;
  channel: "whatsapp" | "sms" | "email";
  /** Subject line (email channel only). */
  subject?: string;
}

export interface SendResult {
  providerMessageId: string;
}

export interface MessageSender {
  /** Whether this sender has the credentials/config to operate. */
  isConfigured(): boolean;
  send(message: OutboundMessage): Promise<Result<SendResult, AppError>>;
}
