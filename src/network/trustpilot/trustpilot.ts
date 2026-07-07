/**
 * Trustpilot public API client (app API key). We resolve the business unit from
 * the owner's domain, then pull its score summary and recent reviews.
 * Uses the read-only public endpoints (apikey), not the OAuth Business API.
 */
import "server-only";
import { getServerConfig } from "@/core/config/env";
import { httpJson } from "@/network/http/fetch";

const API = "https://api.trustpilot.com/v1";

export function isTrustpilotConfigured(): boolean {
  return Boolean(getServerConfig().TRUSTPILOT_API_KEY);
}

function apikey(): string {
  return getServerConfig().TRUSTPILOT_API_KEY ?? "";
}

/** Normalize a Trustpilot URL or raw domain to a bare domain (the business unit key). */
export function parseTrustpilotDomain(input: string): string {
  const m = input.match(/trustpilot\.[a-z.]+\/review\/([^/?#]+)/i);
  const raw = m?.[1] ?? input;
  return raw.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").trim();
}

export interface TrustpilotUnit {
  id: string;
  domain: string;
  displayName: string | null;
  rating: number | null;
  reviewCount: number;
  profileUrl: string;
  reviewLink: string;
}

export async function findTrustpilotUnit(domain: string): Promise<TrustpilotUnit | null> {
  const found = await httpJson<{
    id?: string;
    displayName?: string;
    numberOfReviews?: { total?: number };
    score?: { stars?: number; trustScore?: number };
    identifyingName?: string;
  }>(`${API}/business-units/find?name=${encodeURIComponent(domain)}&apikey=${apikey()}`);
  if (!found.id) return null;
  return {
    id: found.id,
    domain,
    displayName: found.displayName ?? domain,
    rating: found.score?.stars ?? null,
    reviewCount: found.numberOfReviews?.total ?? 0,
    profileUrl: `https://www.trustpilot.com/review/${domain}`,
    reviewLink: `https://www.trustpilot.com/evaluate/${domain}`,
  };
}

export interface TrustpilotReview {
  externalId: string;
  rating: number;
  text: string | null;
  authorName: string | null;
  createdAt: string | null;
}

export async function getTrustpilotReviews(businessUnitId: string): Promise<TrustpilotReview[]> {
  const data = await httpJson<{
    reviews?: {
      id: string;
      stars: number;
      text?: string;
      title?: string;
      createdAt?: string;
      consumer?: { displayName?: string };
    }[];
  }>(`${API}/business-units/${encodeURIComponent(businessUnitId)}/reviews?perPage=20&apikey=${apikey()}`);
  return (data.reviews ?? []).map((r) => ({
    externalId: r.id,
    rating: r.stars,
    text: r.text ?? r.title ?? null,
    authorName: r.consumer?.displayName ?? null,
    createdAt: r.createdAt ?? null,
  }));
}
