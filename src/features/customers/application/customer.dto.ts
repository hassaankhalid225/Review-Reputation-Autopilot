/** Presentation-safe shapes for the customers feature. */
import type { Customer } from "../domain/customer.entity";

export interface AddCustomerInput {
  businessId: string;
  name?: string | null;
  phone: string;
  tags?: string[];
  consent?: boolean;
}

export interface CustomerView {
  id: string;
  name: string | null;
  phone: string;
  tags: string[];
  consent: boolean;
  lastRequestAt: string | null;
  createdAt: string | null;
}

export function toCustomerView(c: Customer): CustomerView {
  const p = c.toJSON();
  return {
    id: p.id,
    name: p.name,
    phone: p.phone,
    tags: p.tags,
    consent: p.consent,
    lastRequestAt: p.lastRequestAt,
    createdAt: p.createdAt,
  };
}
