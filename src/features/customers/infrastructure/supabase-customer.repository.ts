/**
 * ADAPTER: SupabaseCustomerRepository. RLS scopes every query to the caller's
 * memberships; soft-deleted rows (deleted_at not null) are excluded from reads.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { Result, ok, err } from "@/core/result/result";
import { type AppError, InternalError } from "@/core/errors/app-error";
import { type Paginated, paginate, toRange } from "@/core/types/pagination";
import type { Database } from "@/network/supabase/types";
import { Customer } from "../domain/customer.entity";
import { DuplicateCustomerError } from "../domain/customer.errors";
import type { CustomerRepository, ListCustomersQuery } from "../domain/customer.repository";
import type { PhoneNumber } from "../domain/phone.vo";
import { mapCustomerRow } from "./customer.mapper";

export class SupabaseCustomerRepository implements CustomerRepository {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async findByPhone(businessId: string, phone: PhoneNumber): Promise<Result<Customer | null, AppError>> {
    const { data, error } = await this.db
      .from("customers")
      .select("*")
      .eq("business_id", businessId)
      .eq("phone", phone.e164)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) return err(new InternalError("Could not look up customer.", error));
    return ok(data ? mapCustomerRow(data) : null);
  }

  async findById(businessId: string, id: string): Promise<Result<Customer | null, AppError>> {
    const { data, error } = await this.db
      .from("customers")
      .select("*")
      .eq("business_id", businessId)
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) return err(new InternalError("Could not look up customer.", error));
    return ok(data ? mapCustomerRow(data) : null);
  }

  async markRequested(businessId: string, id: string, atIso: string): Promise<Result<void, AppError>> {
    const { error } = await this.db
      .from("customers")
      .update({ last_request_at: atIso })
      .eq("business_id", businessId)
      .eq("id", id);
    if (error) return err(new InternalError("Could not update customer.", error));
    return ok(undefined);
  }

  async save(customer: Customer): Promise<Result<Customer, AppError>> {
    const p = customer.toJSON();
    const { data, error } = await this.db
      .from("customers")
      .insert({
        business_id: p.businessId,
        name: p.name,
        phone: p.phone,
        tags: p.tags,
        consent: p.consent,
        source: p.source,
      })
      .select("*")
      .single();
    if (error) {
      if (error.code === "23505") return err(new DuplicateCustomerError());
      return err(new InternalError("Could not save customer.", error));
    }
    return ok(mapCustomerRow(data));
  }

  async saveMany(customers: Customer[]): Promise<Result<number, AppError>> {
    const rows = customers.map((c) => {
      const p = c.toJSON();
      return {
        business_id: p.businessId,
        name: p.name,
        phone: p.phone,
        tags: p.tags,
        consent: p.consent,
        source: p.source,
      };
    });
    // Ignore rows that collide with an existing (business_id, phone) pair.
    const { data, error } = await this.db
      .from("customers")
      .upsert(rows, { onConflict: "business_id,phone", ignoreDuplicates: true })
      .select("id");
    if (error) return err(new InternalError("Could not import customers.", error));
    return ok(data?.length ?? 0);
  }

  async list(query: ListCustomersQuery): Promise<Result<Paginated<Customer>, AppError>> {
    const { from, to, page, pageSize } = toRange(query);
    let q = this.db
      .from("customers")
      .select("*", { count: "exact" })
      .eq("business_id", query.businessId)
      .is("deleted_at", null);

    if (query.search?.trim()) {
      const term = `%${query.search.trim()}%`;
      q = q.or(`name.ilike.${term},phone.ilike.${term}`);
    }

    const { data, error, count } = await q.order("created_at", { ascending: false }).range(from, to);
    if (error) return err(new InternalError("Could not load customers.", error));
    return ok(paginate(data.map(mapCustomerRow), count ?? 0, page, pageSize));
  }

  async countActive(businessId: string): Promise<Result<number, AppError>> {
    const { count, error } = await this.db
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .is("deleted_at", null);
    if (error) return err(new InternalError("Could not count customers.", error));
    return ok(count ?? 0);
  }

  async softDelete(businessId: string, customerId: string): Promise<Result<void, AppError>> {
    const { error } = await this.db
      .from("customers")
      .update({ deleted_at: new Date().toISOString() })
      .eq("business_id", businessId)
      .eq("id", customerId);
    if (error) return err(new InternalError("Could not delete customer.", error));
    return ok(undefined);
  }
}
