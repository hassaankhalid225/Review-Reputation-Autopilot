/** Use case: add a single customer (validate phone → dedupe → save → audit). */
import { Result, err } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { AuditLogger } from "@/core/audit/audit-logger";
import { Customer } from "../domain/customer.entity";
import { PhoneNumber } from "../domain/phone.vo";
import { DuplicateCustomerError } from "../domain/customer.errors";
import type { CustomerRepository } from "../domain/customer.repository";
import { type AddCustomerInput, type CustomerView, toCustomerView } from "./customer.dto";

export class AddCustomerUseCase {
  constructor(
    private readonly repo: CustomerRepository,
    private readonly audit: AuditLogger,
  ) {}

  async execute(actorId: string, input: AddCustomerInput): Promise<Result<CustomerView, AppError>> {
    const phone = PhoneNumber.create(input.phone);
    if (phone.isErr()) return err(phone.error);

    const existing = await this.repo.findByPhone(input.businessId, phone.value);
    if (existing.isErr()) return err(existing.error);
    if (existing.value) return err(new DuplicateCustomerError());

    const customer = Customer.create({
      businessId: input.businessId,
      name: input.name,
      phone: phone.value,
      tags: input.tags,
      consent: input.consent,
      source: "manual",
    });

    const saved = await this.repo.save(customer);
    if (saved.isErr()) return err(saved.error);

    await this.audit.record({
      businessId: input.businessId,
      actorId,
      action: "customer.added",
      entity: "customer",
      entityId: saved.value.id,
    });
    return saved.map(toCustomerView);
  }
}
