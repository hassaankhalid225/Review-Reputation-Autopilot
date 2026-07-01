/** PORT: AiDraftRepository — records generated drafts for usage/analytics. */
import type { Result } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";

export interface NewAiDraft {
  businessId: string;
  reviewId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  draftText: string;
}

export interface AiDraftRepository {
  record(draft: NewAiDraft): Promise<Result<void, AppError>>;
}
