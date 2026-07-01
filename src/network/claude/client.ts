/**
 * Anthropic (Claude) client factory — raw I/O only (network layer).
 * Reads the API key from server config; never imported into client components.
 */
import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getServerConfig } from "@/core/config/env";

/** Default model for review-reply drafting. */
export const CLAUDE_MODEL = "claude-opus-4-8";

let cached: Anthropic | null = null;

export function isClaudeConfigured(): boolean {
  return Boolean(getServerConfig().ANTHROPIC_API_KEY);
}

/** Returns a shared Anthropic client, or null if no API key is configured. */
export function getClaudeClient(): Anthropic | null {
  const { ANTHROPIC_API_KEY } = getServerConfig();
  if (!ANTHROPIC_API_KEY) return null;
  cached ??= new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  return cached;
}
