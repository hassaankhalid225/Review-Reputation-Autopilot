"use server";

/** Server Action: save website widget settings. */
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { getSessionUser } from "@/features/auth/presentation/session";
import { getActiveBusinessId } from "@/features/businesses/presentation/active-business";
import { actionErr, toActionResult, type ActionResult } from "@/core/result/action-result";
import { UnauthenticatedError, ValidationError } from "@/core/errors/app-error";

const schema = z.object({
  enabled: z.boolean(),
  minRating: z.number().int().min(1).max(5),
  theme: z.enum(["auto", "light", "dark"]),
  layout: z.enum(["grid", "carousel", "list"]),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Accent must be a hex colour."),
  headline: z.string().trim().max(120).nullable(),
  maxReviews: z.number().int().min(1).max(24),
});

export async function saveWidgetSettingsAction(input: unknown): Promise<ActionResult<void>> {
  const user = await getSessionUser();
  if (!user) return actionErr(new UnauthenticatedError());
  const businessId = await getActiveBusinessId();
  if (!businessId) return actionErr(new ValidationError("Create a business first."));

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return actionErr(new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input."));
  }

  const { resolve } = await getServerContainer();
  const result = await resolve(TOKENS.SaveWidgetSettingsUseCase).execute(user.id, businessId, parsed.data);
  if (result.isOk()) revalidatePath("/app/grow");
  return toActionResult(result);
}
