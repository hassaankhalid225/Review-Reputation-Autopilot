"use server";

/** Server Actions for billing: start checkout / request manual upgrade. */
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { clientConfig } from "@/core/config/env";
import { getSessionUser } from "@/features/auth/presentation/session";
import { getActiveBusinessId } from "@/features/businesses/presentation/active-business";
import { actionErr, toActionResult, type ActionResult } from "@/core/result/action-result";
import { UnauthenticatedError, ValidationError } from "@/core/errors/app-error";

const planSchema = z.object({ plan: z.enum(["starter", "pro"]) });

export async function createCheckoutAction(input: unknown): Promise<ActionResult<{ url: string }>> {
  const user = await getSessionUser();
  if (!user) return actionErr(new UnauthenticatedError());
  const businessId = await getActiveBusinessId();
  if (!businessId) return actionErr(new ValidationError("Create a business first."));
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return actionErr(new ValidationError("Choose a plan."));

  const { resolve } = await getServerContainer();
  const result = await resolve(TOKENS.CreateCheckoutUseCase).execute({
    businessId,
    plan: parsed.data.plan,
    customerEmail: user.email,
    successUrl: `${clientConfig.NEXT_PUBLIC_APP_URL}/app/billing?status=success`,
    cancelUrl: `${clientConfig.NEXT_PUBLIC_APP_URL}/app/billing?status=cancelled`,
  });
  return toActionResult(result, (r) => ({ url: r.url }));
}

export async function submitManualPaymentAction(input: unknown): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return actionErr(new UnauthenticatedError());
  const businessId = await getActiveBusinessId();
  if (!businessId) return actionErr(new ValidationError("Create a business first."));
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return actionErr(new ValidationError("Choose a plan."));

  const { resolve } = await getServerContainer();
  const result = await resolve(TOKENS.SubmitManualPaymentUseCase).execute(user.id, businessId, parsed.data.plan);
  if (result.isOk()) revalidatePath("/app/billing");
  return toActionResult(result);
}
