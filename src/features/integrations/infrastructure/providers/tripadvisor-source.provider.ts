/**
 * ADAPTER: TripAdvisorSourceProvider — TripAdvisor Content API (app key). The
 * owner pastes their listing URL (or name); we resolve the location, then pull
 * its rating summary + recent reviews.
 */
import "server-only";
import { Result, ok, err } from "@/core/result/result";
import { type AppError, NotFoundError, ProviderError, ValidationError } from "@/core/errors/app-error";
import { logger } from "@/core/logger/logger";
import {
  getTripAdvisorLocation,
  getTripAdvisorReviews,
  isTripAdvisorConfigured,
  parseTripAdvisorLocationId,
  searchTripAdvisorLocation,
} from "@/network/tripadvisor/tripadvisor";
import type { Platform } from "../../domain/platform";
import type {
  ConnectMethod,
  ConnectedSource,
  ProviderConnectInput,
  ReviewSourceProvider,
} from "../../domain/integrations.ports";

export class TripAdvisorSourceProvider implements ReviewSourceProvider {
  readonly platform: Platform = "tripadvisor";
  readonly method: ConnectMethod = "api";

  isConfigured(): boolean {
    return isTripAdvisorConfigured();
  }

  async connect(input: ProviderConnectInput): Promise<Result<ConnectedSource, AppError>> {
    const raw = (input.query ?? input.reviewLink ?? "").trim();
    if (!raw) return err(new ValidationError("Paste your TripAdvisor listing URL or business name."));
    try {
      const searchQuery = input.location ? `${raw} ${input.location}` : raw;
      const locationId = parseTripAdvisorLocationId(raw) ?? (await searchTripAdvisorLocation(searchQuery));
      if (!locationId) return err(new NotFoundError("Couldn't find that listing on TripAdvisor."));
      const location = await getTripAdvisorLocation(locationId);
      if (!location) return err(new NotFoundError("Couldn't load that TripAdvisor listing."));
      const reviews = await getTripAdvisorReviews(locationId).catch(() => []);
      return ok({
        platform: "tripadvisor",
        externalId: location.locationId,
        displayName: location.name,
        reviewLink: location.writeReviewUrl,
        profileUrl: location.webUrl,
        credentials: null,
        avgRating: location.rating,
        reviewCount: location.reviewCount,
        reviews: reviews.map((r) => ({
          externalId: r.externalId,
          rating: r.rating,
          text: r.text,
          authorName: r.authorName,
          createdAt: r.createdAt,
        })),
      });
    } catch (e) {
      logger.error("tripadvisor.connect_failed", { error: String(e) });
      return err(new ProviderError("Couldn't reach TripAdvisor. Please try again."));
    }
  }
}
