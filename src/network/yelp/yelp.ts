/**
 * Yelp Fusion API client (app API key). Yelp offers no per-owner OAuth, and the
 * public API returns rating + up to 3 review excerpts — that's the platform's
 * hard limit, not ours. We resolve a business from its Yelp URL/alias, then pull
 * the summary + review snippets.
 */
import "server-only";
import { getServerConfig } from "@/core/config/env";
import { httpJson } from "@/network/http/fetch";

const API = "https://api.yelp.com/v3";

export function isYelpConfigured(): boolean {
  return Boolean(getServerConfig().YELP_API_KEY);
}

function authHeader() {
  return { Authorization: `Bearer ${getServerConfig().YELP_API_KEY ?? ""}` };
}

/** Extract the business alias from a Yelp URL (…/biz/<alias>) or return input. */
export function parseYelpAlias(input: string): string {
  const m = input.match(/yelp\.[a-z.]+\/biz\/([^/?#]+)/i);
  return (m?.[1] ?? input).trim();
}

export interface YelpBusiness {
  id: string;
  name: string;
  rating: number | null;
  reviewCount: number;
  url: string | null;
}

/** Auto-search: find the best-matching business by name + location. */
export async function searchYelpBusiness(term: string, location: string): Promise<YelpBusiness | null> {
  const params = new URLSearchParams({ term, location: location || term, limit: "1" });
  const data = await httpJson<{
    businesses?: { id: string; name: string; rating?: number; review_count?: number; url?: string }[];
  }>(`${API}/businesses/search?${params.toString()}`, { headers: authHeader() });
  const b = data.businesses?.[0];
  if (!b) return null;
  return {
    id: b.id,
    name: b.name,
    rating: b.rating ?? null,
    reviewCount: b.review_count ?? 0,
    url: b.url ?? null,
  };
}

export async function getYelpBusiness(alias: string): Promise<YelpBusiness | null> {
  const data = await httpJson<{
    id?: string;
    name?: string;
    rating?: number;
    review_count?: number;
    url?: string;
    error?: { code: string };
  }>(`${API}/businesses/${encodeURIComponent(alias)}`, { headers: authHeader() });
  if (!data.id) return null;
  return {
    id: data.id,
    name: data.name ?? alias,
    rating: data.rating ?? null,
    reviewCount: data.review_count ?? 0,
    url: data.url ?? null,
  };
}

export interface YelpReview {
  externalId: string;
  rating: number;
  text: string | null;
  authorName: string | null;
  createdAt: string | null;
}

export async function getYelpReviews(businessId: string): Promise<YelpReview[]> {
  const data = await httpJson<{
    reviews?: {
      id: string;
      rating: number;
      text?: string;
      time_created?: string;
      user?: { name?: string };
    }[];
  }>(`${API}/businesses/${encodeURIComponent(businessId)}/reviews?limit=3&sort_by=newest`, {
    headers: authHeader(),
  });
  return (data.reviews ?? []).map((r) => ({
    externalId: r.id,
    rating: r.rating,
    text: r.text ?? null,
    authorName: r.user?.name ?? null,
    createdAt: r.time_created ?? null,
  }));
}
