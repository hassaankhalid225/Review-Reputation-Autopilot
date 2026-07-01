/**
 * Stripe webhook endpoint. Verifies the signature and applies subscription
 * state changes via the service-scoped DI (no user session; RLS bypassed).
 * Must read the raw body for HMAC verification — do not parse before verifying.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getServiceContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { logger } from "@/core/logger/logger";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  try {
    const { resolve } = getServiceContainer();
    const result = await resolve(TOKENS.HandleWebhookUseCase).execute(payload, signature);
    if (result.isErr()) {
      logger.warn("stripe.webhook_rejected", { code: result.error.code });
      return NextResponse.json({ error: result.error.message }, { status: result.error.httpStatus });
    }
    return NextResponse.json({ received: true });
  } catch (e) {
    logger.error("stripe.webhook_error", { error: String(e) });
    return NextResponse.json({ error: "Webhook handling failed." }, { status: 500 });
  }
}
