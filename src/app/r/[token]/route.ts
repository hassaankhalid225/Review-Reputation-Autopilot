/**
 * Public review-request short link: `/r/<token>`.
 *
 * Resolves the token to the business's Google review URL, records the click
 * (best-effort), and 302-redirects the customer there. No session — runs in the
 * service DI scope; access is scoped by the unguessable token, not by RLS.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getServiceContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { clientConfig } from "@/core/config/env";
import { logger } from "@/core/logger/logger";

export async function GET(_request: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const fallback = `${clientConfig.NEXT_PUBLIC_APP_URL}/?r=expired`;

  if (!/^[0-9A-Za-z]{6,24}$/.test(token)) {
    return NextResponse.redirect(fallback);
  }

  try {
    const { resolve } = getServiceContainer();
    const result = await resolve(TOKENS.ResolveLinkUseCase).execute(token);
    if (result.isOk() && result.value) {
      return NextResponse.redirect(result.value);
    }
  } catch (e) {
    // Service client unavailable (no service key) or transient error.
    logger.error("redirect.resolve_failed", { error: String(e) });
  }
  return NextResponse.redirect(fallback);
}
