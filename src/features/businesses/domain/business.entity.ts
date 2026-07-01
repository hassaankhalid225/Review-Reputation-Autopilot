/**
 * Domain entity: Business — the tenant root (SRS §5.2.2).
 * Pure; no framework imports. Invariants: non-empty name, valid brand tone.
 */
import { Result, ok, err } from "@/core/result/result";
import { ValidationError } from "@/core/errors/app-error";

export type BrandTone = "friendly" | "formal" | "short";
export const BRAND_TONES: readonly BrandTone[] = ["friendly", "formal", "short"];

export interface BusinessProps {
  id: string;
  ownerId: string;
  name: string;
  category: string | null;
  country: string | null;
  city: string | null;
  timezone: string;
  currency: string;
  brandTone: BrandTone;
  languages: string[];
  createdAt: string | null;
}

export interface NewBusiness {
  ownerId: string;
  name: string;
  category?: string | null;
  country?: string | null;
  city?: string | null;
  timezone?: string;
  currency?: string;
  brandTone?: BrandTone;
  languages?: string[];
}

const DEFAULTS = {
  timezone: "Asia/Karachi",
  currency: "PKR",
  brandTone: "friendly" as BrandTone,
  languages: ["en"],
};

export class Business {
  private constructor(private readonly props: BusinessProps) {}

  /** Rehydrate from persistence (already valid). */
  static fromProps(props: BusinessProps): Business {
    return new Business(props);
  }

  /** Validate + construct a new business (id assigned by the DB). */
  static create(input: NewBusiness): Result<Business, ValidationError> {
    const name = input.name.trim();
    if (name.length < 2) return err(new ValidationError("Business name is too short."));
    if (name.length > 80) return err(new ValidationError("Business name is too long."));
    const brandTone = input.brandTone ?? DEFAULTS.brandTone;
    if (!BRAND_TONES.includes(brandTone)) return err(new ValidationError("Invalid brand tone."));

    return ok(
      new Business({
        id: "",
        ownerId: input.ownerId,
        name,
        category: input.category?.trim() || null,
        country: input.country?.trim() || null,
        city: input.city?.trim() || null,
        timezone: input.timezone ?? DEFAULTS.timezone,
        currency: input.currency ?? DEFAULTS.currency,
        brandTone,
        languages: input.languages?.length ? input.languages : DEFAULTS.languages,
        createdAt: null,
      }),
    );
  }

  get id(): string {
    return this.props.id;
  }
  get ownerId(): string {
    return this.props.ownerId;
  }
  get name(): string {
    return this.props.name;
  }
  get category(): string | null {
    return this.props.category;
  }
  get city(): string | null {
    return this.props.city;
  }
  get brandTone(): BrandTone {
    return this.props.brandTone;
  }

  toJSON(): BusinessProps {
    return { ...this.props };
  }
}
