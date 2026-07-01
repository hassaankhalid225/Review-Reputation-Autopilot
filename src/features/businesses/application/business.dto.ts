/** Presentation-safe shapes for the businesses feature (ARCHITECTURE §4.1). */
import type { Business, BrandTone } from "../domain/business.entity";

export interface CreateBusinessInput {
  ownerId: string;
  name: string;
  category?: string | null;
  city?: string | null;
  country?: string | null;
}

/** Serializable view returned across the server→client boundary. */
export interface BusinessView {
  id: string;
  name: string;
  category: string | null;
  city: string | null;
  brandTone: BrandTone;
}

export function toBusinessView(b: Business): BusinessView {
  const props = b.toJSON();
  return {
    id: props.id,
    name: props.name,
    category: props.category,
    city: props.city,
    brandTone: props.brandTone,
  };
}
