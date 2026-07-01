/**
 * Use case: save/post a reply to a review.
 *
 * Posting to Google is delegated to the ReplyPoster port (infrastructure); when
 * unavailable (not yet connected) we persist the reply as a draft so it isn't
 * lost. Splitting the port keeps this use case independent of Google specifics.
 */
import { Result, err, ok } from "@/core/result/result";
import { type AppError, NotFoundError, ValidationError } from "@/core/errors/app-error";
import type { AuditLogger } from "@/core/audit/audit-logger";
import type { ReviewRepository } from "../domain/review.repository";
import { type ReviewView, toReviewView } from "./review.dto";

/** PORT: posts a reply to the external review source (e.g. Google). */
export interface ReplyPoster {
  isConfigured(businessId: string): Promise<boolean>;
  post(businessId: string, googleReviewId: string, replyText: string): Promise<Result<void, AppError>>;
}

export class ReplyToReviewUseCase {
  constructor(
    private readonly repo: ReviewRepository,
    private readonly poster: ReplyPoster,
    private readonly audit: AuditLogger,
  ) {}

  async execute(
    actorId: string,
    businessId: string,
    reviewId: string,
    replyText: string,
  ): Promise<Result<ReviewView, AppError>> {
    const text = replyText.trim();
    if (text.length < 2) return err(new ValidationError("Reply is too short."));
    if (text.length > 4000) return err(new ValidationError("Reply is too long."));

    const found = await this.repo.findById(businessId, reviewId);
    if (found.isErr()) return err(found.error);
    if (!found.value) return err(new NotFoundError("Review not found."));

    const review = found.value.toJSON();
    let status: "posted" | "drafted" = "drafted";

    if (await this.poster.isConfigured(businessId)) {
      const posted = await this.poster.post(businessId, review.googleReviewId, text);
      if (posted.isErr()) {
        // Persist as a failed attempt but keep the text so the owner can retry.
        const saved = await this.repo.saveReply(businessId, reviewId, text, "failed");
        return saved.isErr() ? err(saved.error) : err(posted.error);
      }
      status = "posted";
    }

    const saved = await this.repo.saveReply(businessId, reviewId, text, status);
    if (saved.isErr()) return err(saved.error);

    await this.audit.record({
      businessId,
      actorId,
      action: status === "posted" ? "review.replied" : "review.reply_drafted",
      entity: "review",
      entityId: reviewId,
    });
    return ok(toReviewView(saved.value));
  }
}
