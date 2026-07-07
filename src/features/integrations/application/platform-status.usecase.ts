/**
 * Use case: report each platform's effective connect method and whether its live
 * API is configured — so the UI can render the right connect affordance (OAuth
 * button vs. API lookup dialog vs. link paste).
 */
import type { Platform } from "../domain/platform";
import { PLATFORMS } from "../domain/platform";
import type { ConnectMethod, ReviewSourceProviderRegistry } from "../domain/integrations.ports";

export interface PlatformStatus {
  platform: Platform;
  method: ConnectMethod;
  /** True when live API/OAuth credentials are present (else link fallback). */
  live: boolean;
}

export class GetPlatformStatusesUseCase {
  constructor(private readonly registry: ReviewSourceProviderRegistry) {}

  execute(): PlatformStatus[] {
    return PLATFORMS.map((platform) => {
      const provider = this.registry.get(platform);
      return {
        platform,
        method: provider?.method ?? "link",
        live: provider?.isConfigured() ?? false,
      };
    });
  }
}
