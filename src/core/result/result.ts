/**
 * Result<T, E> — explicit success/failure without throwing.
 *
 * Used across the Application and Domain layers for *expected* outcomes
 * (validation, not-found, quota exceeded). Thrown exceptions are reserved
 * for programmer errors / truly exceptional infrastructure failures.
 *
 * See Docs/ARCHITECTURE.md §6.1.
 */

export type Result<T, E = Error> = Ok<T, E> | Err<T, E>;

export class Ok<T, E> {
  readonly _tag = "ok" as const;
  constructor(public readonly value: T) {}

  isOk(): this is Ok<T, E> {
    return true;
  }
  isErr(): this is Err<T, E> {
    return false;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    return new Ok(fn(this.value));
  }
  mapErr<F>(_fn: (error: E) => F): Result<T, F> {
    return new Ok(this.value);
  }
  /** Chain another fallible operation. */
  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }
  /** Return the value, or `fallback` if this is an Err. */
  unwrapOr(_fallback: T): T {
    return this.value;
  }
  match<U>(handlers: { ok: (value: T) => U; err: (error: E) => U }): U {
    return handlers.ok(this.value);
  }
}

export class Err<T, E> {
  readonly _tag = "err" as const;
  constructor(public readonly error: E) {}

  isOk(): this is Ok<T, E> {
    return false;
  }
  isErr(): this is Err<T, E> {
    return true;
  }

  map<U>(_fn: (value: T) => U): Result<U, E> {
    return new Err(this.error);
  }
  mapErr<F>(fn: (error: E) => F): Result<T, F> {
    return new Err(fn(this.error));
  }
  andThen<U>(_fn: (value: T) => Result<U, E>): Result<U, E> {
    return new Err(this.error);
  }
  unwrapOr(fallback: T): T {
    return fallback;
  }
  match<U>(handlers: { ok: (value: T) => U; err: (error: E) => U }): U {
    return handlers.err(this.error);
  }
}

export const ok = <T, E = never>(value: T): Result<T, E> => new Ok(value);
export const err = <E, T = never>(error: E): Result<T, E> => new Err(error);

/** Collect a list of Results into a Result of list (fails on first Err). */
export function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];
  for (const r of results) {
    if (r.isErr()) return err(r.error);
    values.push(r.value);
  }
  return ok(values);
}

/** Run a throwing function and capture the throw as an Err. */
export async function fromPromise<T, E = Error>(
  promise: Promise<T>,
  mapError: (e: unknown) => E,
): Promise<Result<T, E>> {
  try {
    return ok(await promise);
  } catch (e) {
    return err(mapError(e));
  }
}
