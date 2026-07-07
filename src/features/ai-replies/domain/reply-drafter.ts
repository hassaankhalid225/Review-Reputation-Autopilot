/**
 * PORT: ReplyDrafter (ARCHITECTURE §6.4) — drafts a reply to a review.
 * Default adapter ClaudeReplyDrafter; swappable with any LLM or a fake in tests.
 */
import type { Result } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";

export type BrandTone = "friendly" | "formal" | "short";

/** A single owner fact the AI may reference. */
export interface BrandFactRef {
  label: string;
  value: string;
}

/** An owner-authored example reply for the AI to emulate in style. */
export interface ReplyTemplateRef {
  title: string;
  trigger: "any" | "positive" | "mixed" | "negative";
  body: string;
}

/** Owner-authored brand context that shapes the draft (all optional). */
export interface BrandContext {
  description?: string | null;
  aiContext?: string | null;
  aiAvoid?: string | null;
  signature?: string | null;
  /** BCP-47-ish language code the reply should be written in (e.g. "en", "ur"). */
  language?: string | null;
  facts?: BrandFactRef[];
  templates?: ReplyTemplateRef[];
}

export interface DraftRequest {
  businessName: string;
  brandTone: BrandTone;
  rating: number;
  reviewText: string | null;
  authorName: string | null;
  brand?: BrandContext;
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
