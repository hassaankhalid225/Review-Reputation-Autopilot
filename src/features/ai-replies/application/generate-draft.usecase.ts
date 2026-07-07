/**
 * Use case: generate an AI-drafted reply for a review.
 * Loads the review, drafts via the ReplyDrafter port, persists the draft on the
 * review (status `drafted`), records token usage, and audits. The owner edits
 * and posts it from the reviews screen.
 */
import { Result, err, ok } from "@/core/result/result";
import { type AppError, NotFoundError, ProviderError } from "@/core/errors/app-error";
import type { AuditLogger } from "@/core/audit/audit-logger";
import type { ReviewRepository } from "@/features/reviews/domain/review.repository";
import { type ReviewView, toReviewView } from "@/features/reviews/application/review.dto";
import type { ReplyDrafter, BrandTone, BrandContext } from "../domain/reply-drafter";
import type { AiDraftRepository } from "../domain/ai-draft.repository";

export class GenerateDraftUseCase {
  constructor(
    private readonly reviews: ReviewRepository,
    private readonly drafter: ReplyDrafter,
    private readonly drafts: AiDraftRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(
    actorId: string,
    businessId: string,
    reviewId: string,
    businessName: string,
    brandTone: BrandTone,
    brand?: BrandContext,
  ): Promise<Result<ReviewView, AppError>> {
    if (!this.drafter.isConfigured()) {
      return err(new ProviderError("AI replies aren't configured yet. Add an Anthropic API key."));
    }

    const found = await this.reviews.findById(businessId, reviewId);
    if (found.isErr()) return err(found.error);
    if (!found.value) return err(new NotFoundError("Review not found."));
    const review = found.value.toJSON();

    const drafted = await this.drafter.draft({
      businessName,
      brandTone,
      rating: review.rating,
      reviewText: review.text,
      authorName: review.authorName,
      brand,
    });
    if (drafted.isErr()) return err(drafted.error);

    const saved = await this.reviews.saveReply(businessId, reviewId, drafted.value.text, "drafted");
    if (saved.isErr()) return err(saved.error);

    // Best-effort usage record — never block the draft on analytics.
    await this.drafts.record({
      businessId,
      reviewId,
      model: drafted.value.model,
      promptTokens: drafted.value.promptTokens,
      completionTokens: drafted.value.completionTokens,
      draftText: drafted.value.text,
    });

    await this.audit.record({
      businessId,
      actorId,
      action: "ai.draft_generated",
      entity: "review",
      entityId: reviewId,
      metadata: { model: drafted.value.model },
    });

    return ok(toReviewView(saved.value));
  }
}
