/**
 * Serializable result for Server Actions (crosses the server→client boundary).
 * Maps a domain Result/AppError into a plain object the UI can render.
 */
import type { Result } from "./result";
import type { AppError, ErrorCode } from "@/core/errors/app-error";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; code: ErrorCode; message: string };

export function actionOk<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionErr(error: AppError): ActionResult<never> {
  return { ok: false, code: error.code, message: error.message };
}

export function toActionResult<T, R = T>(
  result: Result<T, AppError>,
  map?: (value: T) => R,
): ActionResult<R> {
  return result.match<ActionResult<R>>({
    ok: (value) => actionOk((map ? map(value) : (value as unknown as R))),
    err: (error) => actionErr(error),
  });
}
