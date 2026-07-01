/** Maps a `customers` DB row ⇄ the Customer domain entity. */
import type { Tables } from "@/network/supabase/types";
import { Customer, type CustomerSource } from "../domain/customer.entity";

export function mapCustomerRow(row: Tables<"customers">): Customer {
  return Customer.fromProps({
    id: row.id,
    businessId: row.business_id,
    name: row.name,
    phone: row.phone,
    tags: row.tags ?? [],
    consent: row.consent ?? true,
    source: (row.source ?? "manual") as CustomerSource,
    lastRequestAt: row.last_request_at,
    createdAt: row.created_at,
  });
}
