/**
 * Domain entity: Business — the tenant root (SRS §5.2.2).
 * Pure; no framework imports. Invariants: non-empty name, valid brand tone.
 *
 * The BrandProfile block (tagline, description, contact, socials, AI voice…) is
 * owner-editable from Settings and feeds the AI reply drafter and public pages.
 */
import { Result, ok, err } from "@/core/result/result";
import { ValidationError } from "@/core/errors/app-error";

export type BrandTone = "friendly" | "formal" | "short";
export const BRAND_TONES: readonly BrandTone[] = ["friendly", "formal", "short"];

/** Social handles/links; every field optional. */
export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  linkedin?: string;
  twitter?: string;
}

export type ReplyTemplateTrigger = "any" | "positive" | "mixed" | "negative";
export const REPLY_TEMPLATE_TRIGGERS: readonly ReplyTemplateTrigger[] = [
  "any",
  "positive",
  "mixed",
  "negative",
];

/** An owner-authored reply template. The owner may add as many as they like. */
export interface ReplyTemplate {
  id: string;
  title: string;
  trigger: ReplyTemplateTrigger;
  body: string;
}

/** A free-form brand fact (label → value) the AI may reference. */
export interface BrandFact {
  id: string;
  label: string;
  value: string;
}

/** Owner-authored brand data. All optional except `replyLanguage` (defaults). */
export interface BrandProfile {
  tagline: string | null;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  brandColor: string | null;
  publicEmail: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  socials: SocialLinks;
  aiSignature: string | null;
  aiContext: string | null;
  aiAvoid: string | null;
  replyLanguage: string;
  replyTemplates: ReplyTemplate[];
  brandFacts: BrandFact[];
}

/** AI Autopilot automation settings. */
export interface AutopilotConfig {
  autopilotEnabled: boolean;
  autopilotAutoPost: boolean;
  /** Auto-post only reviews with rating >= this (1–5). */
  autopilotMinRating: number;
}

export const DEFAULT_AUTOPILOT: AutopilotConfig = {
  autopilotEnabled: false,
  autopilotAutoPost: false,
  autopilotMinRating: 4,
};

export interface BusinessProps extends BrandProfile, AutopilotConfig {
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
  brandColor: "#4f46e5",
  replyLanguage: "en",
};

/** Empty brand profile — used when creating a business (owner fills it later). */
export const EMPTY_BRAND_PROFILE: BrandProfile = {
  tagline: null,
  description: null,
  website: null,
  logoUrl: null,
  brandColor: DEFAULTS.brandColor,
  publicEmail: null,
  phone: null,
  whatsapp: null,
  address: null,
  socials: {},
  aiSignature: null,
  aiContext: null,
  aiAvoid: null,
  replyLanguage: DEFAULTS.replyLanguage,
  replyTemplates: [],
  brandFacts: [],
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
        ...EMPTY_BRAND_PROFILE,
        ...DEFAULT_AUTOPILOT,
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
