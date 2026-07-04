/** Display metadata for each connectable platform (presentation-only). */
import type { LucideIcon } from "lucide-react";
import { MapPin, ThumbsUp, Camera, Utensils, Plane, ShieldCheck } from "lucide-react";
import type { Platform } from "@/network/supabase/types";
import { PLATFORM_CAPABILITIES } from "../domain/platform";

export interface PlatformMeta {
  platform: Platform;
  label: string;
  blurb: string;
  icon: LucideIcon;
  /** Brand accent (hex) used for the icon chip. */
  accent: string;
  /** Placeholder shown in the "paste your link" field. */
  linkPlaceholder: string;
  /** How to connect (from domain capabilities). */
  method: "oauth" | "link";
}

export const PLATFORM_CATALOG: Record<Platform, PlatformMeta> = {
  google: {
    platform: "google",
    label: "Google",
    blurb: "Google Business Profile — the reviews that show up in Search & Maps.",
    icon: MapPin,
    accent: "#4285F4",
    linkPlaceholder: "https://g.page/r/your-business/review",
    method: PLATFORM_CAPABILITIES.google.method,
  },
  facebook: {
    platform: "facebook",
    label: "Facebook",
    blurb: "Recommendations and reviews from your Facebook Page.",
    icon: ThumbsUp,
    accent: "#1877F2",
    linkPlaceholder: "https://facebook.com/YourPage/reviews",
    method: PLATFORM_CAPABILITIES.facebook.method,
  },
  instagram: {
    platform: "instagram",
    label: "Instagram",
    blurb: "Send followers to your review page and grow social proof.",
    icon: Camera,
    accent: "#E4405F",
    linkPlaceholder: "https://instagram.com/yourbusiness",
    method: PLATFORM_CAPABILITIES.instagram.method,
  },
  yelp: {
    platform: "yelp",
    label: "Yelp",
    blurb: "Popular for restaurants, salons and local services in the West.",
    icon: Utensils,
    accent: "#FF1A1A",
    linkPlaceholder: "https://yelp.com/biz/your-business",
    method: PLATFORM_CAPABILITIES.yelp.method,
  },
  tripadvisor: {
    platform: "tripadvisor",
    label: "TripAdvisor",
    blurb: "Essential for hotels, restaurants and anything travel & tourism.",
    icon: Plane,
    accent: "#00AA6C",
    linkPlaceholder: "https://tripadvisor.com/your-listing",
    method: PLATFORM_CAPABILITIES.tripadvisor.method,
  },
  trustpilot: {
    platform: "trustpilot",
    label: "Trustpilot",
    blurb: "The trust signal for e-commerce and online businesses.",
    icon: ShieldCheck,
    accent: "#00B67A",
    linkPlaceholder: "https://trustpilot.com/review/yourdomain.com",
    method: PLATFORM_CAPABILITIES.trustpilot.method,
  },
};

/** Catalog in a stable display order. */
export const PLATFORM_LIST: PlatformMeta[] = [
  PLATFORM_CATALOG.google,
  PLATFORM_CATALOG.facebook,
  PLATFORM_CATALOG.instagram,
  PLATFORM_CATALOG.yelp,
  PLATFORM_CATALOG.tripadvisor,
  PLATFORM_CATALOG.trustpilot,
];
