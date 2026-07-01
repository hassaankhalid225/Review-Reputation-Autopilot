"use server";

/** Server Actions for the reviews feature. */
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { getSessionUser } from "@/features/auth/presentation/session";
import { getActiveBusinessId } from "@/features/businesses/presentation/active-business";
import { actionErr, toActionResult, type ActionResult } from "@/core/result/action-result";
import { UnauthenticatedError, ValidationError } from "@/core/errors/app-error";
import type { ReviewView } from "../application/review.dto";

const replySchema = z.object({
  reviewId: z.string().uuid(),
  replyText: z.string().trim().min(2, "Reply is too short.").max(4000),
});

export async function replyToReviewAction(input: unknown): Promise<ActionResult<ReviewView>> {
  const user = await getSessionUser();
  if (!user) return actionErr(new UnauthenticatedError());
  const businessId = await getActiveBusinessId();
  if (!businessId) return actionErr(new ValidationError("Create a business first."));

  const parsed = replySchema.safeParse(input);
  if (!parsed.success) {
    return actionErr(new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input."));
  }

  const { resolve } = await getServerContainer();
  const result = await resolve(TOKENS.ReplyToReviewUseCase).execute(
    user.id,
    businessId,
    parsed.data.reviewId,
    parsed.data.replyText,
  );
  if (result.isOk()) revalidatePath("/app/reviews");
  return toActionResult(result);
}
