"use server";

/** Server Actions for connecting/disconnecting review sources. */
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { getSessionUser } from "@/features/auth/presentation/session";
import { getActiveBusinessId } from "@/features/businesses/presentation/active-business";
import { actionErr, toActionResult, type ActionResult } from "@/core/result/action-result";
import { UnauthenticatedError, ValidationError } from "@/core/errors/app-error";
import type { Platform } from "@/network/supabase/types";
import { PLATFORMS } from "../domain/platform";

const platformSchema = z.enum(PLATFORMS as unknown as [Platform, ...Platform[]]);

const connectSchema = z.object({
  platform: platformSchema,
  reviewLink: z.string().trim().url("Enter a valid URL.").max(2048),
  displayName: z.string().trim().max(120).optional(),
});

const disconnectSchema = z.object({ platform: platformSchema });

export async function connectSourceAction(input: unknown): Promise<ActionResult<void>> {
  const user = await getSessionUser();
  if (!user) return actionErr(new UnauthenticatedError());
  const businessId = await getActiveBusinessId();
  if (!businessId) return actionErr(new ValidationError("Create a business first."));

  const parsed = connectSchema.safeParse(input);
  if (!parsed.success) {
    return actionErr(new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input."));
  }

  const { resolve } = await getServerContainer();
  const result = await resolve(TOKENS.ConnectSourceUseCase).execute(
    user.id,
    businessId,
    parsed.data.platform,
    { reviewLink: parsed.data.reviewLink, displayName: parsed.data.displayName },
  );
  if (result.isOk()) {
    revalidatePath("/app/integrations");
    revalidatePath("/app/grow");
  }
  return toActionResult(result);
}

export async function disconnectSourceAction(input: unknown): Promise<ActionResult<void>> {
  const user = await getSessionUser();
  if (!user) return actionErr(new UnauthenticatedError());
  const businessId = await getActiveBusinessId();
  if (!businessId) return actionErr(new ValidationError("Create a business first."));

  const parsed = disconnectSchema.safeParse(input);
  if (!parsed.success) {
    return actionErr(new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input."));
  }

  const { resolve } = await getServerContainer();
  const result = await resolve(TOKENS.DisconnectSourceUseCase).execute(
    user.id,
    businessId,
    parsed.data.platform,
  );
  if (result.isOk()) {
    revalidatePath("/app/integrations");
    revalidatePath("/app/grow");
  }
  return toActionResult(result);
}
