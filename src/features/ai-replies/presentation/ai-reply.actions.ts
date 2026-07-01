"use server";

/** Server Action: generate an AI-drafted reply for a review. */
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { getSessionUser } from "@/features/auth/presentation/session";
import { getTenantContext } from "@/features/businesses/presentation/active-business";
import { actionErr, toActionResult, type ActionResult } from "@/core/result/action-result";
import { RateLimitedError, UnauthenticatedError, ValidationError } from "@/core/errors/app-error";
import { checkRateLimit } from "@/core/rate-limit/rate-limiter";
import type { ReviewView } from "@/features/reviews/application/review.dto";

export async function generateDraftAction(reviewId: unknown): Promise<ActionResult<ReviewView>> {
  const user = await getSessionUser();
  if (!user) return actionErr(new UnauthenticatedError());
  const { active } = await getTenantContext();
  if (!active) return actionErr(new ValidationError("Create a business first."));
  if (!z.string().uuid().safeParse(reviewId).success) {
    return actionErr(new ValidationError("Invalid review."));
  }

  // AI drafting is billable — cap to 20 per minute per business.
  const limit = checkRateLimit(`ai-draft:${active.id}`, 20, 60_000, Date.now());
  if (!limit.allowed) {
    return actionErr(new RateLimitedError("You're drafting too fast. Please wait a moment."));
  }

  const { resolve } = await getServerContainer();
  const result = await resolve(TOKENS.GenerateDraftUseCase).execute(
    user.id,
    active.id,
    reviewId as string,
    active.name,
    active.brandTone,
  );
  if (result.isOk()) revalidatePath("/app/reviews");
  return toActionResult(result);
}
