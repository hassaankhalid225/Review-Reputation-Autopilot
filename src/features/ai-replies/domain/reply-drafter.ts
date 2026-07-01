/**
 * PORT: ReplyDrafter (ARCHITECTURE §6.4) — drafts a reply to a review.
 * Default adapter ClaudeReplyDrafter; swappable with any LLM or a fake in tests.
 */
import type { Result } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";

export type BrandTone = "friendly" | "formal" | "short";

export interface DraftRequest {
  businessName: string;
  brandTone: BrandTone;
  rating: number;
  reviewText: string | null;
  authorName: string | null;
}

export interface DraftResult {
  text: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
}

export interface ReplyDrafter {
  isConfigured(): boolean;
  draft(request: DraftRequest): Promise<Result<DraftResult, AppError>>;
}
