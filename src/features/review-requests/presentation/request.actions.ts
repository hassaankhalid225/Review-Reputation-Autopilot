"use server";

/** Server Actions for review requests. */
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { getSessionUser } from "@/features/auth/presentation/session";
import { getTenantContext } from "@/features/businesses/presentation/active-business";
import { actionErr, toActionResult, type ActionResult } from "@/core/result/action-result";
import { UnauthenticatedError, ValidationError } from "@/core/errors/app-error";
import type { RequestView } from "../application/request.dto";

const sendSchema = z.object({ customerId: z.string().uuid() });

export async function sendRequestAction(input: unknown): Promise<ActionResult<RequestView>> {
  const user = await getSessionUser();
  if (!user) return actionErr(new UnauthenticatedError());
  const { active } = await getTenantContext();
  if (!active) return actionErr(new ValidationError("Create a business first."));

  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) return actionErr(new ValidationError("Invalid customer."));

  const { resolve } = await getServerContainer();
  const result = await resolve(TOKENS.SendRequestUseCase).execute(
    user.id,
    { businessId: active.id, customerId: parsed.data.customerId, now: new Date().toISOString() },
    active.name,
  );
  if (result.isOk()) {
    revalidatePath("/app/requests");
    revalidatePath("/app/customers");
  }
  return toActionResult(result);
}
