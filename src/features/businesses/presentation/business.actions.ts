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

/** "" → null so clearing a field in the UI actually clears it in the DB. */
const emptyToNull = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v.length ? v : null))
    .nullable()
    .optional();

/** Optional URL that also accepts "" (→ null). Adds https:// if the scheme is missing. */
const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .transform((v) => (v.length ? (/^https?:\/\//i.test(v) ? v : `https://${v}`) : null))
  .refine((v) => v === null || /^https?:\/\/[^\s.]+\.[^\s]{2,}/i.test(v), "Enter a valid URL.")
  .nullable()
  .optional();

const replyTemplatesSchema = z
  .array(
    z.object({
      id: z.string().trim().min(1).max(64),
      title: z.string().trim().min(1, "Give the template a title.").max(60),
      trigger: z.enum(["any", "positive", "mixed", "negative"]),
      body: z.string().trim().min(1, "Template body can't be empty.").max(800),
    }),
  )
  .max(30)
  .optional();

const brandFactsSchema = z
  .array(
    z.object({
      id: z.string().trim().min(1).max(64),
      label: z.string().trim().min(1, "Give the fact a label.").max(60),
      value: z.string().trim().min(1, "Add a value for the fact.").max(300),
    }),
  )
  .max(40)
  .optional();

const socialsSchema = z
  .object({
    instagram: z.string().trim().max(120).optional(),
    facebook: z.string().trim().max(120).optional(),
    tiktok: z.string().trim().max(120).optional(),
    youtube: z.string().trim().max(120).optional(),
    linkedin: z.string().trim().max(120).optional(),
    twitter: z.string().trim().max(120).optional(),
  })
  .optional();

const updateSchema = z.object({
  businessId: z.string().uuid(),
  name: z.string().trim().min(2).max(80).optional(),
  category: emptyToNull(60),
  city: emptyToNull(60),
  country: emptyToNull(60),
  timezone: z.string().trim().max(60).optional(),
  currency: z.string().trim().max(8).optional(),
  brandTone: z.enum(BRAND_TONES as unknown as [string, ...string[]]).optional(),
  languages: z.array(z.string().trim().min(2).max(8)).max(6).optional(),
  // Brand profile
  tagline: emptyToNull(120),
  description: emptyToNull(1200),
  website: optionalUrl,
  logoUrl: optionalUrl,
  brandColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Brand colour must be a 6-digit hex like #4f46e5.")
    .optional(),
  publicEmail: z
    .union([z.literal(""), z.string().trim().email("Enter a valid email.")])
    .transform((v) => (v.length ? v : null))
    .nullable()
    .optional(),
  phone: emptyToNull(40),
  whatsapp: emptyToNull(40),
  address: emptyToNull(200),
  socials: socialsSchema,
  aiSignature: emptyToNull(120),
  aiContext: emptyToNull(1500),
  aiAvoid: emptyToNull(400),
  replyLanguage: z.string().trim().min(2).max(8).optional(),
  replyTemplates: replyTemplatesSchema,
  brandFacts: brandFactsSchema,
  autopilotEnabled: z.boolean().optional(),
  autopilotAutoPost: z.boolean().optional(),
  autopilotMinRating: z.number().int().min(1).max(5).optional(),
});

export async function updateBusinessAction(input: unknown): Promise<ActionResult<BusinessView>> {
  const user = await getSessionUser();
  if (!user) return actionErr(new UnauthenticatedError());

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return actionErr(new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input."));
  }
  const { businessId, socials, ...patch } = parsed.data;

  // Drop empty social handles so we don't persist blank keys.
  const cleanedSocials = socials
    ? Object.fromEntries(Object.entries(socials).filter(([, v]) => v && v.length))
    : undefined;

  const { resolve } = await getServerContainer();
  const result = await resolve(TOKENS.UpdateBusinessUseCase).execute(user.id, businessId, {
    ...patch,
    ...(cleanedSocials ? { socials: cleanedSocials } : {}),
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
