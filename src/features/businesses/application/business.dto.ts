/** Presentation-safe shapes for the businesses feature (ARCHITECTURE §4.1). */
import type { Business, BrandTone, BrandProfile, AutopilotConfig } from "../domain/business.entity";

export type {
  SocialLinks,
  ReplyTemplate,
  BrandFact,
  ReplyTemplateTrigger,
  AutopilotConfig,
} from "../domain/business.entity";

export interface CreateBusinessInput {
  ownerId: string;
  name: string;
  category?: string | null;
  city?: string | null;
  country?: string | null;
}

/** Serializable view returned across the server→client boundary. */
export interface BusinessView extends BrandProfile, AutopilotConfig {
  id: string;
  name: string;
  category: string | null;
  country: string | null;
  city: string | null;
  timezone: string;
  currency: string;
  brandTone: BrandTone;
  languages: string[];
}

export function toBusinessView(b: Business): BusinessView {
  const p = b.toJSON();
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    country: p.country,
    city: p.city,
    timezone: p.timezone,
    currency: p.currency,
    brandTone: p.brandTone,
    languages: p.languages,
    tagline: p.tagline,
    description: p.description,
    website: p.website,
    logoUrl: p.logoUrl,
    brandColor: p.brandColor,
    publicEmail: p.publicEmail,
    phone: p.phone,
    whatsapp: p.whatsapp,
    address: p.address,
    socials: p.socials,
    aiSignature: p.aiSignature,
    aiContext: p.aiContext,
    aiAvoid: p.aiAvoid,
    replyLanguage: p.replyLanguage,
    replyTemplates: p.replyTemplates,
    brandFacts: p.brandFacts,
    autopilotEnabled: p.autopilotEnabled,
    autopilotAutoPost: p.autopilotAutoPost,
    autopilotMinRating: p.autopilotMinRating,
  };
}

export type { BrandProfile };
