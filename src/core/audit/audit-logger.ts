/**
 * PORT: AuditLogger — records audit-worthy domain events (ARCHITECTURE §10).
 *
 * Use cases depend on this interface; infrastructure binds it to a concrete
 * sink (Supabase `audit_log`). Auditing is best-effort and MUST never throw
 * into the primary operation — a failed audit write is logged, not surfaced.
 */
export interface AuditEvent {
  businessId: string | null;
  actorId: string | null;
  /** Stable verb, e.g. "business.created", "customer.added", "review.replied". */
  action: string;
  entity?: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AuditLogger {
  record(event: AuditEvent): Promise<void>;
}

/** Default no-op (used where auditing isn't wired, e.g. tests). */
export class NoopAuditLogger implements AuditLogger {
  async record(): Promise<void> {
    /* intentionally empty */
  }
}
