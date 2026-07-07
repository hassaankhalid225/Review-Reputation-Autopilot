/**
 * TripAdvisor Content API client (app API key). Partner-approved key model (no
 * per-owner OAuth). We search for the location, then pull details (rating,
 * review count, write-review link) and up to a few recent reviews.
 */
import "server-only";
import { getServerConfig } from "@/core/config/env";
import { httpJson } from "@/network/http/fetch";

const API = "https://api.content.tripadvisor.com/api/v1";

export function isTripAdvisorConfigured(): boolean {
  return Boolean(getServerConfig().TRIPADVISOR_API_KEY);
}

function key(): string {
  return getServerConfig().TRIPADVISOR_API_KEY ?? "";
}

/** Extract a numeric location id from a TripAdvisor URL (…-d<ID>-…) if present. */
export function parseTripAdvisorLocationId(input: string): string | null {
  return input.match(/-d(\d+)-/)?.[1] ?? null;
}

export async function searchTripAdvisorLocation(query: string): Promise<string | null> {
  const data = await httpJson<{ data?: { location_id: string }[] }>(
    `${API}/location/search?key=${key()}&searchQuery=${encodeURIComponent(query)}`,
  );
  return data.data?.[0]?.location_id ?? null;
}

export interface TripAdvisorLocation {
  locationId: string;
  name: string;
  rating: number | null;
  reviewCount: number;
  webUrl: string | null;
  writeReviewUrl: string | null;
}

export async function getTripAdvisorLocation(locationId: string): Promise<TripAdvisorLocation | null> {
  const data = await httpJson<{
    location_id?: string;
    name?: string;
    rating?: string;
    num_reviews?: string;
    web_url?: string;
    write_review?: string;
  }>(`${API}/location/${encodeURIComponent(locationId)}/details?key=${key()}&language=en`);
  if (!data.location_id) return null;
  return {
    locationId: data.location_id,
    name: data.name ?? locationId,
    rating: data.rating ? Number(data.rating) : null,
    reviewCount: data.num_reviews ? Number(data.num_reviews) : 0,
    webUrl: data.web_url ?? null,
    writeReviewUrl: data.write_review ?? data.web_url ?? null,
  };
}

export interface TripAdvisorReview {
  externalId: string;
  rating: number;
  text: string | null;
  authorName: string | null;
  createdAt: string | null;
}

export async function getTripAdvisorReviews(locationId: string): Promise<TripAdvisorReview[]> {
  const data = await httpJson<{
    data?: {
      id: number;
      rating: number;
      text?: string;
      published_date?: string;
      user?: { username?: string };
    }[];
  }>(`${API}/location/${encodeURIComponent(locationId)}/reviews?key=${key()}&language=en`);
  return (data.data ?? []).map((r) => ({
    externalId: String(r.id),
    rating: r.rating,
    text: r.text ?? null,
    authorName: r.user?.username ?? null,
    createdAt: r.published_date ?? null,
  }));
}
