/**
 * Google Business Profile OAuth callback. Verifies the CSRF nonce, exchanges
 * the code, and stores the connected location for the user's business.
 */
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { getSessionUser } from "@/features/auth/presentation/session";
import { GOOGLE_STATE_COOKIE } from "@/features/google-locations/presentation/google.constants";
import { clientConfig } from "@/core/config/env";
import { logger } from "@/core/logger/logger";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const base = clientConfig.NEXT_PUBLIC_APP_URL;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const providerError = searchParams.get("error");

  if (providerError) {
    return NextResponse.redirect(`${base}/onboarding?google=denied`);
  }

  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(`${base}/login`);

  const [nonce, businessId] = (state ?? "").split(":");
  const cookieStore = await cookies();
  const expected = cookieStore.get(GOOGLE_STATE_COOKIE)?.value;
  cookieStore.delete(GOOGLE_STATE_COOKIE);

  if (!code || !nonce || !businessId || nonce !== expected) {
    return NextResponse.redirect(`${base}/onboarding?google=invalid`);
  }

  try {
    const { resolve } = await getServerContainer();
    const result = await resolve(TOKENS.ConnectGoogleUseCase).execute(user.id, businessId, code);
    if (result.isErr()) {
      logger.warn("google.callback_failed", { code: result.error.code });
      return NextResponse.redirect(`${base}/onboarding?google=error`);
    }
    return NextResponse.redirect(`${base}/onboarding?google=connected`);
  } catch (e) {
    logger.error("google.callback_error", { error: String(e) });
    return NextResponse.redirect(`${base}/onboarding?google=error`);
  }
}
