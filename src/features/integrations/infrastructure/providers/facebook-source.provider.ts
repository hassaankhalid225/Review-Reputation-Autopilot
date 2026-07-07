/**
 * ADAPTER: FacebookSourceProvider — real Meta OAuth, mirroring Google.
 * Owner consents → we exchange the code, discover their Page, and pull the
 * Page's ratings/recommendations into the unified reviews feed.
 */
import "server-only";
import { Result, ok, err } from "@/core/result/result";
import { type AppError, ProviderError, ValidationError } from "@/core/errors/app-error";
import { logger } from "@/core/logger/logger";
import {
  buildFacebookConsentUrl,
  discoverPrimaryPage,
  exchangeFacebookCode,
  fetchFacebookRatings,
  isFacebookConfigured,
} from "@/network/facebook/facebook";
import type { Platform } from "../../domain/platform";
import type {
  ConnectMethod,
  ConnectedSource,
  ReviewSourceProvider,
} from "../../domain/integrations.ports";

export class FacebookSourceProvider implements ReviewSourceProvider {
  readonly platform: Platform = "facebook";
  readonly method: ConnectMethod = "oauth";

  isConfigured(): boolean {
    return isFacebookConfigured();
  }

  buildAuthUrl(state: string): string {
    return buildFacebookConsentUrl(state);
  }

  async completeAuth(code: string): Promise<Result<ConnectedSource, AppError>> {
    try {
      const userToken = await exchangeFacebookCode(code);
      const page = await discoverPrimaryPage(userToken);
      if (!page) {
        return err(new ValidationError("No Facebook Page found on this account. You must be a Page admin."));
      }
      const ratings = await fetchFacebookRatings(page.id, page.accessToken);
      return ok({
        platform: "facebook",
        externalId: page.id,
        displayName: page.name,
        reviewLink: `https://www.facebook.com/${page.id}/reviews`,
        profileUrl: page.link,
        credentials: { pageId: page.id, pageAccessToken: page.accessToken },
        avgRating: ratings.avgRating,
        reviewCount: ratings.reviewCount,
        reviews: ratings.reviews,
      });
    } catch (e) {
      logger.error("facebook.connect_failed", { error: String(e) });
      return err(new ProviderError("Couldn't connect Facebook. Please try again."));
    }
  }

  async connect(): Promise<Result<ConnectedSource, AppError>> {
    return err(new ValidationError("Facebook connects via the Connect button (OAuth)."));
  }
}
