/**
 * Use case: resolve a public short token to its destination review link and
 * record the click. Runs in the service scope (no user session) for the public
 * `/r/<token>` redirect endpoint. Returns null when the token is unknown.
 */
import { Result, ok, err } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { ReviewRequestRepository } from "../domain/review-request.repository";

export class ResolveLinkUseCase {
  constructor(private readonly repo: ReviewRequestRepository) {}

  async execute(token: string): Promise<Result<string | null, AppError>> {
    const found = await this.repo.findByToken(token);
    if (found.isErr()) return err(found.error);
    if (!found.value || !found.value.reviewLink) return ok(null);

    // Best-effort click tracking — never block the redirect on it.
    await this.repo.recordClick(found.value.id);
    return ok(found.value.reviewLink);
  }
}
