/**
 * ADAPTER: ClaudeReplyDrafter — drafts review replies with Claude (Opus 4.8,
 * adaptive thinking). Maps the brand tone + rating into a tight prompt and
 * returns the reply text plus token usage. Falls back to NotConfigured when no
 * API key is present (the use case checks isConfigured first).
 */
import "server-only";
import { Result, ok, err } from "@/core/result/result";
import { type AppError, ProviderError } from "@/core/errors/app-error";
import { logger } from "@/core/logger/logger";
import { CLAUDE_MODEL, getClaudeClient, isClaudeConfigured } from "@/network/claude/client";
import type { DraftRequest, DraftResult, ReplyDrafter, BrandTone } from "../domain/reply-drafter";

const TONE_GUIDANCE: Record<BrandTone, string> = {
  friendly: "Warm, personable, and genuine. Use the reviewer's first name if available.",
  formal: "Polished and professional, courteous and precise.",
  short: "Concise and to the point — two sentences at most.",
};

function buildPrompt(r: DraftRequest): string {
  const sentiment = r.rating <= 2 ? "negative" : r.rating === 3 ? "mixed" : "positive";
  return [
    `You are the owner of "${r.businessName}" replying to a Google review.`,
    `Tone: ${TONE_GUIDANCE[r.brandTone]}`,
    `The review is ${sentiment} (${r.rating}/5 stars).`,
    r.authorName ? `Reviewer: ${r.authorName}.` : "",
    r.reviewText ? `Review text: "${r.reviewText}"` : "The reviewer left no text.",
    "",
    "Write a reply that:",
    "- Thanks the reviewer and sounds human, never templated.",
    sentiment === "negative"
      ? "- Acknowledges the issue, apologizes sincerely, and offers to make it right offline."
      : "- Reinforces what they liked and invites them back.",
    "- Is safe to post publicly: no discounts, no PII, no defensiveness.",
    "- Returns ONLY the reply text, with no preamble, quotes, or sign-off placeholders.",
  ]
    .filter(Boolean)
    .join("\n");
}

export class ClaudeReplyDrafter implements ReplyDrafter {
  isConfigured(): boolean {
    return isClaudeConfigured();
  }

  async draft(request: DraftRequest): Promise<Result<DraftResult, AppError>> {
    const client = getClaudeClient();
    if (!client) return err(new ProviderError("AI replies aren't configured."));

    try {
      const message = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        thinking: { type: "adaptive" },
        system: "You write concise, on-brand replies to customer reviews for small businesses.",
        messages: [{ role: "user", content: buildPrompt(request) }],
      });

      const text = message.content
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("")
        .trim();

      if (!text) return err(new ProviderError("The AI returned an empty reply. Please try again."));

      return ok({
        text,
        model: message.model,
        promptTokens: message.usage.input_tokens,
        completionTokens: message.usage.output_tokens,
      });
    } catch (e) {
      logger.error("claude.draft_failed", { error: String(e) });
      return err(new ProviderError("Couldn't generate a reply right now. Please try again."));
    }
  }
}
