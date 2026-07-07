/** Maps a `businesses` DB row ⇄ the Business domain entity. */
import type { Tables } from "@/network/supabase/types";
import { Business, EMPTY_BRAND_PROFILE, type BrandTone, type SocialLinks } from "../domain/business.entity";

export function mapBusinessRow(row: Tables<"businesses">): Business {
  return Business.fromProps({
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    category: row.category,
    country: row.country,
    city: row.city,
    timezone: row.timezone ?? "Asia/Karachi",
    currency: row.currency ?? "PKR",
    brandTone: (row.brand_tone ?? "friendly") as BrandTone,
    languages: row.languages ?? ["en"],
    tagline: row.tagline ?? null,
    description: row.description ?? null,
    website: row.website ?? null,
    logoUrl: row.logo_url ?? null,
    brandColor: row.brand_color ?? EMPTY_BRAND_PROFILE.brandColor,
    publicEmail: row.public_email ?? null,
    phone: row.phone ?? null,
    whatsapp: row.whatsapp ?? null,
    address: row.address ?? null,
    socials: (row.socials as SocialLinks | null) ?? {},
    aiSignature: row.ai_signature ?? null,
    aiContext: row.ai_context ?? null,
    aiAvoid: row.ai_avoid ?? null,
    replyLanguage: row.reply_language ?? "en",
    replyTemplates: row.reply_templates ?? [],
    brandFacts: row.brand_facts ?? [],
    autopilotEnabled: row.autopilot_enabled ?? false,
    autopilotAutoPost: row.autopilot_autopost ?? false,
    autopilotMinRating: row.autopilot_min_rating ?? 4,
    createdAt: row.created_at,
  });
}
