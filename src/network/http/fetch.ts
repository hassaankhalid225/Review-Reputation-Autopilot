/**
 * Thin fetch wrapper with timeout + bounded retry/backoff for external HTTP
 * (WhatsApp, Twilio, Google). No business logic — just resilient I/O (ARCH §9).
 */
import "server-only";
import { logger } from "@/core/logger/logger";

export interface HttpOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
}

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

const RETRYABLE = new Set([408, 429, 500, 502, 503, 504]);

export async function httpRequest(url: string, opts: HttpOptions = {}): Promise<Response> {
  const { timeoutMs = 10_000, retries = 2, ...init } = opts;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      if (RETRYABLE.has(res.status) && attempt < retries) {
        await backoff(attempt);
        continue;
      }
      return res;
    } catch (e) {
      clearTimeout(timer);
      lastError = e;
      if (attempt < retries) {
        await backoff(attempt);
        continue;
      }
    }
  }
  logger.error("http.request_failed", { url, error: String(lastError) });
  throw new HttpError("Network request failed.", 0, lastError);
}

/** GET/POST JSON helper that throws HttpError on non-2xx. */
export async function httpJson<T>(url: string, opts: HttpOptions = {}): Promise<T> {
  const res = await httpRequest(url, opts);
  const text = await res.text();
  const data = text ? safeParse(text) : null;
  if (!res.ok) {
    throw new HttpError(`HTTP ${res.status}`, res.status, data);
  }
  return data as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function backoff(attempt: number): Promise<void> {
  // Exponential backoff with fixed jitter (no Math.random — deterministic by attempt).
  const base = 200 * 2 ** attempt;
  return new Promise((r) => setTimeout(r, base));
}
