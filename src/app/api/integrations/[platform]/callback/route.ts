/**
 * Generic OAuth callback for review-source platforms (e.g. Facebook), mirroring
 * the Google callback. Verifies the CSRF nonce, then completes the connection.
 */
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { getSessionUser } from "@/features/auth/presentation/session";
import { OAUTH_STATE_COOKIE } from "@/features/integrations/presentation/integrations.constants";
import { isPlatform } from "@/features/integrations/domain/platform";
import { clientConfig } from "@/core/config/env";
import { logger } from "@/core/logger/logger";

export async function GET(request: NextRequest, ctx: { params: Promise<{ platform: string }> }) {
  const { searchParams } = request.nextUrl;
  const base = clientConfig.NEXT_PUBLIC_APP_URL;
  const done = (status: string) => NextResponse.redirect(`${base}/app/integrations?connect=${status}`);

  const { platform } = await ctx.params;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const providerError = searchParams.get("error");

  if (providerError) return done("denied");
  if (!isPlatform(platform)) return done("invalid");

  const user = await getSessionUser();
  if (!user) return NextResponse.redirect(`${base}/login`);

  const [nonce, businessId, statePlatform] = (state ?? "").split(":");
  const cookieStore = await cookies();
  const expected = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE);

  if (!code || !nonce || !businessId || nonce !== expected || statePlatform !== platform) {
    return done("invalid");
  }

  try {
    const { resolve } = await getServerContainer();
    const result = await resolve(TOKENS.CompleteOAuthUseCase).execute(user.id, businessId, platform, code);
    if (result.isErr()) {
      logger.warn("integrations.oauth_failed", { platform, code: result.error.code });
      return done("error");
    }
    return done(`connected_${platform}`);
  } catch (e) {
    logger.error("integrations.oauth_error", { platform, error: String(e) });
    return done("error");
  }
}
