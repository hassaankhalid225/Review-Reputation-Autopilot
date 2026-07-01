import { describe, it, expect } from "vitest";
import { ok } from "@/core/result/result";
import { NoopAuditLogger } from "@/core/audit/audit-logger";
import { Customer } from "../domain/customer.entity";
import type { CustomerRepository } from "../domain/customer.repository";
import { AddCustomerUseCase } from "./add-customer.usecase";

/** In-memory fake — proves the use case is testable with zero infrastructure. */
function makeFakeRepo(seed: Customer[] = []): CustomerRepository & { saved: Customer[] } {
  const saved = [...seed];
  return {
    saved,
    async findByPhone(_b, phone) {
      return ok(saved.find((c) => c.phone === phone.e164) ?? null);
    },
    async findById() {
      return ok(null);
    },
    async markRequested() {
      return ok(undefined);
    },
    async save(customer) {
      saved.push(customer);
      return ok(customer);
    },
    async saveMany(customers) {
      saved.push(...customers);
      return ok(customers.length);
    },
    async list() {
      return ok({ items: saved, total: saved.length, page: 1, pageSize: 20, pageCount: 1 });
    },
    async countActive() {
      return ok(saved.length);
    },
    async softDelete() {
      return ok(undefined);
    },
  };
}

const BIZ = "11111111-1111-1111-1111-111111111111";
const ACTOR = "22222222-2222-2222-2222-222222222222";

describe("AddCustomerUseCase", () => {
  it("adds a valid customer and returns a view", async () => {
    const repo = makeFakeRepo();
    const usecase = new AddCustomerUseCase(repo, new NoopAuditLogger());

    const result = await usecase.execute(ACTOR, { businessId: BIZ, name: "Ayesha", phone: "03001234567" });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) expect(result.value.phone).toBe("+923001234567");
    expect(repo.saved).toHaveLength(1);
  });

  it("rejects an invalid phone number", async () => {
    const repo = makeFakeRepo();
    const usecase = new AddCustomerUseCase(repo, new NoopAuditLogger());

    const result = await usecase.execute(ACTOR, { businessId: BIZ, phone: "abc" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error.code).toBe("INVALID_PHONE");
    expect(repo.saved).toHaveLength(0);
  });

  it("rejects a duplicate phone in the same business", async () => {
    const existing = Customer.fromProps({
      id: "x",
      businessId: BIZ,
      name: "Dup",
      phone: "+923001234567",
      tags: [],
      consent: true,
      source: "manual",
      lastRequestAt: null,
      createdAt: null,
    });
    const repo = makeFakeRepo([existing]);
    const usecase = new AddCustomerUseCase(repo, new NoopAuditLogger());

    const result = await usecase.execute(ACTOR, { businessId: BIZ, phone: "0300 1234567" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) expect(result.error.code).toBe("DUPLICATE");
    expect(repo.saved).toHaveLength(1);
  });
});
