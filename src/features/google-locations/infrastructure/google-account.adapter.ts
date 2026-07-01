/** ADAPTER: GoogleAccountPort — OAuth exchange + GBP location discovery. */
import "server-only";
import { Result, ok, err } from "@/core/result/result";
import { type AppError, ProviderError, ValidationError } from "@/core/errors/app-error";
import { logger } from "@/core/logger/logger";
import { exchangeCode, isGoogleConfigured } from "@/network/google/oauth";
import { discoverPrimaryLocation } from "@/network/google/gbp-client";
import type { ConnectedLocation, GoogleAccountPort } from "../domain/google.ports";

export class GoogleAccountAdapter implements GoogleAccountPort {
  isConfigured(): boolean {
    return isGoogleConfigured();
  }

  async connect(code: string): Promise<Result<ConnectedLocation, AppError>> {
    try {
      const tokens = await exchangeCode(code);
      if (!tokens.refreshToken) {
        return err(new ValidationError("Google didn't return a refresh token. Try connecting again."));
      }
      const location = await discoverPrimaryLocation(tokens.accessToken);
      if (!location) {
        return err(new ValidationError("No Google Business Profile location found on this account."));
      }
      return ok({ ...location, refreshToken: tokens.refreshToken });
    } catch (e) {
      logger.error("google.connect_failed", { error: String(e) });
      return err(new ProviderError("Couldn't connect Google. Please try again."));
    }
  }
}
