/**
 * Use case: bulk-import customers from parsed CSV rows.
 * Validates each row independently, dedupes within the batch, bulk-upserts,
 * and returns a per-row report (imported / skipped / invalid).
 */
import { Result, ok, err } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { AuditLogger } from "@/core/audit/audit-logger";
import { Customer } from "../domain/customer.entity";
import { PhoneNumber } from "../domain/phone.vo";
import type { CustomerRepository } from "../domain/customer.repository";

export interface ImportRow {
  name?: string | null;
  phone: string;
}

export interface ImportReport {
  imported: number;
  invalid: { row: number; phone: string; reason: string }[];
  duplicatesInFile: number;
}

export class ImportCustomersUseCase {
  constructor(
    private readonly repo: CustomerRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(actorId: string, businessId: string, rows: ImportRow[]): Promise<Result<ImportReport, AppError>> {
    const invalid: ImportReport["invalid"] = [];
    const seen = new Set<string>();
    const customers: Customer[] = [];
    let duplicatesInFile = 0;

    rows.forEach((row, i) => {
      const phone = PhoneNumber.create(row.phone);
      if (phone.isErr()) {
        invalid.push({ row: i + 1, phone: row.phone, reason: phone.error.message });
        return;
      }
      if (seen.has(phone.value.e164)) {
        duplicatesInFile++;
        return;
      }
      seen.add(phone.value.e164);
      customers.push(
        Customer.create({ businessId, name: row.name, phone: phone.value, source: "csv" }),
      );
    });

    if (customers.length === 0) {
      return ok({ imported: 0, invalid, duplicatesInFile });
    }

    const saved = await this.repo.saveMany(customers);
    if (saved.isErr()) return err(saved.error);

    await this.audit.record({
      businessId,
      actorId,
      action: "customer.imported",
      entity: "customer",
      metadata: { imported: saved.value, invalid: invalid.length, duplicatesInFile },
    });

    return ok({ imported: saved.value, invalid, duplicatesInFile });
  }
}
