"use server";

/** Server Action: start the Google Business Profile OAuth connect flow. */
import { cookies } from "next/headers";
import { getSessionUser } from "@/features/auth/presentation/session";
import { getActiveBusinessId } from "@/features/businesses/presentation/active-business";
import { buildConsentUrl, isGoogleConfigured } from "@/network/google/oauth";
import { uuid } from "@/shared/lib/id";
import { actionErr, actionOk, type ActionResult } from "@/core/result/action-result";
import { UnauthenticatedError, ValidationError } from "@/core/errors/app-error";
import { GOOGLE_STATE_COOKIE } from "./google.constants";

export async function startGoogleConnectAction(): Promise<ActionResult<{ url: string }>> {
  const user = await getSessionUser();
  if (!user) return actionErr(new UnauthenticatedError());
  const businessId = await getActiveBusinessId();
  if (!businessId) return actionErr(new ValidationError("Create a business first."));
  if (!isGoogleConfigured()) {
    return actionErr(new ValidationError("Google connection isn't enabled yet."));
  }

  // CSRF: random nonce in an httpOnly cookie; echoed in `state` as nonce:businessId.
  const nonce = uuid();
  const cookieStore = await cookies();
  cookieStore.set(GOOGLE_STATE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  const state = `${nonce}:${businessId}`;
  return actionOk({ url: buildConsentUrl(state) });
}
