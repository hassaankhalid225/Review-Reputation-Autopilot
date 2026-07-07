/**
 * Use case: complete a platform OAuth connection (the callback code exchange),
 * mirroring ConnectGoogleUseCase. Delegates persist + ingest to ConnectSourceUseCase.
 */
import { Result, err } from "@/core/result/result";
import { type AppError, ValidationError } from "@/core/errors/app-error";
import type { Platform } from "../domain/platform";
import type { ReviewSourceProviderRegistry } from "../domain/integrations.ports";
import type { ConnectSourceUseCase } from "./connect-source.usecase";

export class CompleteOAuthUseCase {
  constructor(
    private readonly registry: ReviewSourceProviderRegistry,
    private readonly connect: ConnectSourceUseCase,
  ) {}

  async execute(
    actorId: string,
    businessId: string,
    platform: Platform,
    code: string,
  ): Promise<Result<void, AppError>> {
    const provider = this.registry.get(platform);
    if (!provider || provider.method !== "oauth" || !provider.completeAuth) {
      return err(new ValidationError(`${platform} does not support OAuth connect.`));
    }

    const connected = await provider.completeAuth(code);
    if (connected.isErr()) return err(connected.error);

    return this.connect.persist(actorId, businessId, connected.value);
  }
}
