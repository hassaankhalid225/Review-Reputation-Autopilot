/**
 * Structured logging abstraction (ARCHITECTURE §6, §10).
 *
 * One tiny façade so call sites never touch `console` directly and we can later
 * route to Sentry/Datadog by swapping the sink — without touching features.
 * Emits single-line JSON in production (machine-parseable), pretty in dev.
 */
import "server-only";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogFields {
  [key: string]: unknown;
}

const LEVEL_WEIGHT: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN_LEVEL: LogLevel = process.env.NODE_ENV === "production" ? "info" : "debug";

/** Strip values that must never reach logs (tokens, secrets, raw PII keys). */
const REDACT_KEYS = /(token|secret|password|authorization|api[_-]?key|refresh)/i;

function redact(fields: LogFields): LogFields {
  const out: LogFields = {};
  for (const [k, v] of Object.entries(fields)) {
    out[k] = REDACT_KEYS.test(k) ? "[redacted]" : v;
  }
  return out;
}

function emit(level: LogLevel, message: string, fields: LogFields = {}): void {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[MIN_LEVEL]) return;
  const record = { level, message, ...redact(fields) };
  const line = process.env.NODE_ENV === "production" ? JSON.stringify(record) : record;
  const sink = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  sink(line);
}

export interface Logger {
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
  /** Derive a child logger that stamps `context` onto every record. */
  child(context: LogFields): Logger;
}

function make(base: LogFields): Logger {
  return {
    debug: (m, f) => emit("debug", m, { ...base, ...f }),
    info: (m, f) => emit("info", m, { ...base, ...f }),
    warn: (m, f) => emit("warn", m, { ...base, ...f }),
    error: (m, f) => emit("error", m, { ...base, ...f }),
    child: (ctx) => make({ ...base, ...ctx }),
  };
}

export const logger: Logger = make({});
