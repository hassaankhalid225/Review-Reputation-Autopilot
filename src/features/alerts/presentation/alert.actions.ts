"use server";

/** Server Action: acknowledge an alert. */
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { getSessionUser } from "@/features/auth/presentation/session";
import { getActiveBusinessId } from "@/features/businesses/presentation/active-business";
import { actionErr, toActionResult, type ActionResult } from "@/core/result/action-result";
import { UnauthenticatedError, ValidationError } from "@/core/errors/app-error";

export async function acknowledgeAlertAction(alertId: unknown): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return actionErr(new UnauthenticatedError());
  const businessId = await getActiveBusinessId();
  if (!businessId) return actionErr(new ValidationError("Create a business first."));
  if (!z.string().uuid().safeParse(alertId).success) {
    return actionErr(new ValidationError("Invalid alert."));
  }

  const { resolve } = await getServerContainer();
  const result = await resolve(TOKENS.AcknowledgeAlertUseCase).execute(user.id, businessId, alertId as string);
  if (result.isOk()) revalidatePath("/app/alerts");
  return toActionResult(result);
}
