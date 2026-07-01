/** Use case: paginated, optionally-searched customer list (RLS-scoped). */
import { Result } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { Paginated } from "@/core/types/pagination";
import type { CustomerRepository, ListCustomersQuery } from "../domain/customer.repository";
import { type CustomerView, toCustomerView } from "./customer.dto";

export class ListCustomersUseCase {
  constructor(private readonly repo: CustomerRepository) {}

  async execute(query: ListCustomersQuery): Promise<Result<Paginated<CustomerView>, AppError>> {
    const result = await this.repo.list(query);
    return result.map((page) => ({ ...page, items: page.items.map(toCustomerView) }));
  }
}
