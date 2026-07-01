/**
 * ADAPTER: DraftOnlyReplyPoster — the default ReplyPoster until the Google
 * Business Profile adapter is wired (Phase 6/7). Reports "not configured" so
 * the use case persists replies as drafts. Swap this binding in the DI registry
 * for GoogleReplyPoster once OAuth + the GBP reply endpoint are connected.
 */
import { Result, ok } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { ReplyPoster } from "../application/reply-to-review.usecase";

export class DraftOnlyReplyPoster implements ReplyPoster {
  async isConfigured(): Promise<boolean> {
    return false;
  }
  async post(): Promise<Result<void, AppError>> {
    return ok(undefined);
  }
}
