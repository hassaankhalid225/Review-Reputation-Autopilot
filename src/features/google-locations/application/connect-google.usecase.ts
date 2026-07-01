/**
 * Use case: complete the Google OAuth connection for a business.
 * Exchanges the code (via the port), then persists the connected location.
 */
import { Result, err, ok } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { AuditLogger } from "@/core/audit/audit-logger";
import type { GoogleAccountPort, GoogleLocationRepository } from "../domain/google.ports";

export class ConnectGoogleUseCase {
  constructor(
    private readonly account: GoogleAccountPort,
    private readonly repo: GoogleLocationRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(actorId: string, businessId: string, code: string): Promise<Result<void, AppError>> {
    const connected = await this.account.connect(code);
    if (connected.isErr()) return err(connected.error);

    const saved = await this.repo.saveConnection(businessId, connected.value);
    if (saved.isErr()) return err(saved.error);

    await this.audit.record({
      businessId,
      actorId,
      action: "google.connected",
      entity: "google_location",
      metadata: { location: connected.value.displayName },
    });
    return ok(undefined);
  }
}
