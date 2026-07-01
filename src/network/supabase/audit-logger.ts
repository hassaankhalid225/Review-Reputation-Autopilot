/**
 * ADAPTER: SupabaseAuditLogger — persists audit events to the `audit_log` table.
 *
 * `audit_log` is service-role-only (no RLS policies → denied for authenticated),
 * so writes go through the service client. Best-effort: any failure is logged
 * and swallowed so auditing never breaks the user's primary action.
 */
import "server-only";
import type { AuditEvent, AuditLogger } from "@/core/audit/audit-logger";
import { logger } from "@/core/logger/logger";
import { createSupabaseServiceClient } from "./service";

export class SupabaseAuditLogger implements AuditLogger {
  async record(event: AuditEvent): Promise<void> {
    try {
      const db = createSupabaseServiceClient();
      const { error } = await db.from("audit_log").insert({
        business_id: event.businessId,
        actor_id: event.actorId,
        action: event.action,
        entity: event.entity ?? null,
        entity_id: event.entityId ?? null,
        metadata: (event.metadata ?? null) as never,
      });
      if (error) logger.warn("audit.write_failed", { action: event.action, error: error.message });
    } catch (e) {
      // Missing service key in dev, network blip, etc. — degrade silently.
      logger.warn("audit.unavailable", { action: event.action, error: String(e) });
    }
  }
}
