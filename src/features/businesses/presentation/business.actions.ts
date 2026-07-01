"use server";

/**
 * Server Actions for the businesses feature.
 * Boundary validation (zod) → DI use case → serializable ActionResult.
 * Every action authenticates the caller first (defense in depth, ARCHITECTURE §10).
 */
import { z } from "zod";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { getSessionUser } from "@/features/auth/presentation/session";
import { actionErr, actionOk, toActionResult, type ActionResult } from "@/core/result/action-result";
import { UnauthenticatedError, ValidationError } from "@/core/errors/app-error";
import { BRAND_TONES } from "../domain/business.entity";
import type { BusinessView } from "./../application/business.dto";
import { ACTIVE_BUSINESS_COOKIE } from "./active-business";

const createSchema = z.object({
  name: z.string().trim().min(2, "Please enter your business name.").max(80),
  category: z.string().trim().max(60).optional().nullable(),
  city: z.string().trim().max(60).optional().nullable(),
});

export async function createBusinessAction(input: unknown): Promise<ActionResult<BusinessView>> {
  const user = await getSessionUser();
  if (!user) return actionErr(new UnauthenticatedError());

  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return actionErr(new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input."));
  }

  const { resolve } = await getServerContainer();
  const result = await resolve(TOKENS.CreateBusinessUseCase).execute({
    ownerId: user.id,
    name: parsed.data.name,
    category: parsed.data.category ?? null,
    city: parsed.data.city ?? null,
  });

  if (result.isOk()) {
    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_BUSINESS_COOKIE, result.value.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    revalidatePath("/", "layout");
  }
  return toActionResult(result);
}

const updateSchema = z.object({
  businessId: z.string().uuid(),
  name: z.string().trim().min(2).max(80).optional(),
  category: z.string().trim().max(60).nullable().optional(),
  city: z.string().trim().max(60).nullable().optional(),
  brandTone: z.enum(BRAND_TONES as unknown as [string, ...string[]]).optional(),
});

export async function updateBusinessAction(input: unknown): Promise<ActionResult<BusinessView>> {
  const user = await getSessionUser();
  if (!user) return actionErr(new UnauthenticatedError());

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return actionErr(new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input."));
  }
  const { businessId, ...patch } = parsed.data;

  const { resolve } = await getServerContainer();
  const result = await resolve(TOKENS.UpdateBusinessUseCase).execute(user.id, businessId, {
    ...patch,
    brandTone: patch.brandTone as BusinessView["brandTone"] | undefined,
  });
  if (result.isOk()) revalidatePath("/", "layout");
  return toActionResult(result);
}

/** Switch the active business (validated against memberships before persisting). */
export async function switchBusinessAction(businessId: string): Promise<ActionResult> {
  const user = await getSessionUser();
  if (!user) return actionErr(new UnauthenticatedError());

  const { resolve } = await getServerContainer();
  const list = await resolve(TOKENS.ListBusinessesUseCase).execute();
  if (list.isErr()) return toActionResult(list);
  if (!list.value.some((b) => b.id === businessId)) {
    return actionErr(new ValidationError("You don't have access to that business."));
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_BUSINESS_COOKIE, businessId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath("/", "layout");
  return actionOk(undefined);
}
