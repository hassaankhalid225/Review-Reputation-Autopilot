/** Maps a `businesses` DB row ⇄ the Business domain entity. */
import type { Tables } from "@/network/supabase/types";
import { Business, type BrandTone } from "../domain/business.entity";

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
    createdAt: row.created_at,
  });
}
