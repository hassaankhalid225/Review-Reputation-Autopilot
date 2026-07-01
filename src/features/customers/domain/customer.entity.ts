/**
 * Domain entity: Customer (SRS §5.2.5). A person a business can request a
 * review from. Invariants: belongs to a tenant, has a valid E.164 phone,
 * consent gate for outbound messaging.
 */
import { PhoneNumber } from "./phone.vo";

export type CustomerSource = "manual" | "csv" | "pos";

export interface CustomerProps {
  id: string;
  businessId: string;
  name: string | null;
  phone: string; // E.164
  tags: string[];
  consent: boolean;
  source: CustomerSource;
  lastRequestAt: string | null;
  createdAt: string | null;
}

export interface NewCustomer {
  businessId: string;
  name?: string | null;
  phone: PhoneNumber;
  tags?: string[];
  consent?: boolean;
  source?: CustomerSource;
}

export class Customer {
  private constructor(private readonly props: CustomerProps) {}

  static fromProps(props: CustomerProps): Customer {
    return new Customer(props);
  }

  static create(input: NewCustomer): Customer {
    return new Customer({
      id: "",
      businessId: input.businessId,
      name: input.name?.trim() || null,
      phone: input.phone.e164,
      tags: input.tags ?? [],
      consent: input.consent ?? true,
      source: input.source ?? "manual",
      lastRequestAt: null,
      createdAt: null,
    });
  }

  get id(): string {
    return this.props.id;
  }
  get businessId(): string {
    return this.props.businessId;
  }
  get phone(): string {
    return this.props.phone;
  }
  get consent(): boolean {
    return this.props.consent;
  }
  get lastRequestAt(): string | null {
    return this.props.lastRequestAt;
  }

  /** Outbound review requests require consent (SRS anti-spam / FR-CUST-3). */
  canReceiveRequests(): boolean {
    return this.props.consent;
  }

  toJSON(): CustomerProps {
    return { ...this.props };
  }
}
