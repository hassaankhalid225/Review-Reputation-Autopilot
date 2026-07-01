/**
 * Composition root — a tiny, typed, token-based DI container.
 *
 * Features depend on PORTS (interfaces); the container binds those ports to
 * concrete adapters. Two scopes exist:
 *   - "server"  → request-scoped, uses the cookie-bound Supabase server client (RLS on).
 *   - "service" → trusted contexts (webhooks/cron), uses the service-role client (RLS off).
 *
 * See Docs/ARCHITECTURE.md §5. Registrations live in `registry.ts` so this file
 * stays free of feature imports (avoids cycles).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/network/supabase/types";

export type Scope = "server" | "service";

export interface DiContext {
  scope: Scope;
  db: SupabaseClient<Database>;
}

type Factory<T> = (ctx: DiContext, resolve: Resolver) => T;
type Resolver = <T>(token: Token<T>) => T;

/** A typed token. The phantom `__type` makes resolution type-safe. */
export interface Token<T> {
  readonly key: string;
  readonly __type?: T;
}

export function token<T>(key: string): Token<T> {
  return { key };
}

const registry = new Map<string, Factory<unknown>>();

export function register<T>(t: Token<T>, factory: Factory<T>): void {
  registry.set(t.key, factory as Factory<unknown>);
}

/** Build a resolver bound to a context. Instances are cached per-context. */
export function createContainer(ctx: DiContext): { resolve: Resolver } {
  const cache = new Map<string, unknown>();
  const resolve: Resolver = (t) => {
    if (cache.has(t.key)) return cache.get(t.key) as never;
    const factory = registry.get(t.key);
    if (!factory) throw new Error(`No DI registration for token "${t.key}".`);
    const instance = factory(ctx, resolve);
    cache.set(t.key, instance);
    return instance as never;
  };
  return { resolve };
}
