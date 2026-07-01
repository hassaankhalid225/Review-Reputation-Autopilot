/**
 * ADAPTER: GoogleReplyPoster — implements the reviews ReplyPoster port by
 * posting to Google Business Profile. Bound in DI when Google OAuth is
 * configured; `isConfigured` additionally checks the business has a live
 * connection, so unconnected businesses still fall back to draft-only.
 */
import "server-only";
import { Result, ok, err } from "@/core/result/result";
import { type AppError, ProviderError } from "@/core/errors/app-error";
import { logger } from "@/core/logger/logger";
import { isGoogleConfigured } from "@/network/google/oauth";
import { postReply } from "@/network/google/gbp-client";
import type { ReplyPoster } from "@/features/reviews/application/reply-to-review.usecase";
import type { GoogleLocationRepository } from "../domain/google.ports";

export class GoogleReplyPoster implements ReplyPoster {
  constructor(private readonly repo: GoogleLocationRepository) {}

  async isConfigured(businessId: string): Promise<boolean> {
    if (!isGoogleConfigured()) return false;
    const has = await this.repo.hasConnection(businessId);
    return has.isOk() && has.value;
  }

  async post(businessId: string, googleReviewId: string, replyText: string): Promise<Result<void, AppError>> {
    const conn = await this.repo.getConnection(businessId);
    if (conn.isErr()) return err(conn.error);
    if (!conn.value) return err(new ProviderError("Google is not connected."));

    try {
      await postReply(
        conn.value.refreshToken,
        conn.value.googleAccountId,
        conn.value.googleLocationId,
        googleReviewId,
        replyText,
      );
      return ok(undefined);
    } catch (e) {
      logger.error("google.reply_failed", { error: String(e) });
      return err(new ProviderError("Couldn't post the reply to Google."));
    }
  }
}
