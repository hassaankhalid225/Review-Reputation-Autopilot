/**
 * PORT: CustomerRepository. Implemented by infrastructure (Supabase).
 * Tenant scoping is enforced by RLS; the businessId argument also lets use
 * cases authorize explicitly (defense in depth).
 */
import type { Result } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { Paginated, PageQuery } from "@/core/types/pagination";
import type { Customer } from "./customer.entity";
import type { PhoneNumber } from "./phone.vo";

export interface ListCustomersQuery extends PageQuery {
  businessId: string;
  search?: string;
}

export interface CustomerRepository {
  findByPhone(businessId: string, phone: PhoneNumber): Promise<Result<Customer | null, AppError>>;
  findById(businessId: string, id: string): Promise<Result<Customer | null, AppError>>;
  /** Stamp last_request_at after a request is enqueued (anti-spam cooldown). */
  markRequested(businessId: string, id: string, atIso: string): Promise<Result<void, AppError>>;
  save(customer: Customer): Promise<Result<Customer, AppError>>;
  /** Bulk upsert for CSV import; returns the number of rows written. */
  saveMany(customers: Customer[]): Promise<Result<number, AppError>>;
  list(query: ListCustomersQuery): Promise<Result<Paginated<Customer>, AppError>>;
  countActive(businessId: string): Promise<Result<number, AppError>>;
  softDelete(businessId: string, customerId: string): Promise<Result<void, AppError>>;
}
