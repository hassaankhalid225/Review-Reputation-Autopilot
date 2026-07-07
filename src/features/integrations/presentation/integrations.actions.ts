"use server";

/** Server Actions for connecting/disconnecting review sources. */
import { z } from "zod";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { getSessionUser } from "@/features/auth/presentation/session";
import { getActiveBusinessId, getTenantContext } from "@/features/businesses/presentation/active-business";
import { actionErr, actionOk, toActionResult, type ActionResult } from "@/core/result/action-result";
import { UnauthenticatedError, ValidationError } from "@/core/errors/app-error";
import { uuid } from "@/shared/lib/id";
import type { Platform } from "@/network/supabase/types";
import { PLATFORMS } from "../domain/platform";
import { OAUTH_STATE_COOKIE } from "./integrations.constants";

const platformSchema = z.enum(PLATFORMS as unknown as [Platform, ...Platform[]]);

const connectSchema = z.object({
  platform: platformSchema,
  /** A URL, domain, or business name — meaning depends on the platform. */
  query: z.string().trim().min(2, "Enter your business link or name.").max(2048),
  displayName: z.string().trim().max(120).optional(),
});

const disconnectSchema = z.object({ platform: platformSchema });
const oauthSchema = z.object({ platform: platformSchema });

/** OAuth platforms (e.g. Facebook): return the consent URL to redirect to. */
export async function startOAuthConnectAction(input: unknown): Promise<ActionResult<{ url: string }>> {
  const user = await getSessionUser();
  if (!user) return actionErr(new UnauthenticatedError());
  const businessId = await getActiveBusinessId();
  if (!businessId) return actionErr(new ValidationError("Create a business first."));

  const parsed = oauthSchema.safeParse(input);
  if (!parsed.success) return actionErr(new ValidationError("Invalid platform."));

  const { resolve } = await getServerContainer();
  const provider = resolve(TOKENS.ReviewSourceProviderRegistry).get(parsed.data.platform);
  if (!provider || provider.method !== "oauth" || !provider.buildAuthUrl) {
    return actionErr(new ValidationError("This platform isn't set up for OAuth yet."));
  }
  if (!provider.isConfigured()) {
    return actionErr(new ValidationError("This platform's API keys aren't configured yet."));
  }

  // CSRF nonce in an httpOnly cookie; echoed in `state` as nonce:businessId:platform.
  const nonce = uuid();
  const cookieStore = await cookies();
  cookieStore.set(OAUTH_STATE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  return actionOk({ url: provider.buildAuthUrl(`${nonce}:${businessId}:${parsed.data.platform}`) });
}

/**
 * API platforms: find + connect the business automatically using the profile
 * (name + city, or website for Trustpilot) — zero links to paste.
 */
export async function autoConnectSourceAction(input: unknown): Promise<ActionResult<void>> {
  const user = await getSessionUser();
  if (!user) return actionErr(new UnauthenticatedError());

  const parsed = oauthSchema.safeParse(input); // { platform }
  if (!parsed.success) return actionErr(new ValidationError("Invalid platform."));
  const platform = parsed.data.platform;

  const { active } = await getTenantContext();
  if (!active) return actionErr(new ValidationError("Create a business first."));

  // Build the search from the business profile.
  let query: string;
  const location = active.city ?? "";
  if (platform === "trustpilot") {
    if (!active.website) {
      return actionErr(new ValidationError("Add your website in Settings first — Trustpilot matches by domain."));
    }
    query = active.website;
  } else {
    query = active.name;
  }

  const { resolve } = await getServerContainer();
  const result = await resolve(TOKENS.ConnectSourceUseCase).execute(user.id, active.id, platform, {
    query,
    location,
  });
  if (result.isOk()) {
    revalidatePath("/app/integrations");
    revalidatePath("/app/reviews");
  }
  return toActionResult(result);
}

/** API/link platforms: connect from a pasted URL/name. */
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
    { query: parsed.data.query, reviewLink: parsed.data.query, displayName: parsed.data.displayName },
  );
  if (result.isOk()) {
    revalidatePath("/app/integrations");
    revalidatePath("/app/grow");
    revalidatePath("/app/reviews");
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
