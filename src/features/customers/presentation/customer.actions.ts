"use server";

/**
 * Server Actions for the customers feature.
 * Authenticate → resolve active tenant → validate (zod) → DI use case → revalidate.
 */
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { getSessionUser } from "@/features/auth/presentation/session";
import { getActiveBusinessId } from "@/features/businesses/presentation/active-business";
import { actionErr, toActionResult, type ActionResult } from "@/core/result/action-result";
import { UnauthenticatedError, ValidationError } from "@/core/errors/app-error";
import { csvToCustomerRows } from "@/shared/lib/csv";
import type { CustomerView } from "../application/customer.dto";
import type { ImportReport } from "../application/import-customers.usecase";

const addSchema = z.object({
  name: z.string().trim().max(80).optional().nullable(),
  phone: z.string().trim().min(5, "Please enter a phone number.").max(25),
  consent: z.boolean().optional(),
});

type ActionContext =
  | { ok: false; error: UnauthenticatedError | ValidationError }
  | { ok: true; userId: string; businessId: string };

async function requireContext(): Promise<ActionContext> {
  const user = await getSessionUser();
  if (!user) return { ok: false, error: new UnauthenticatedError() };
  const businessId = await getActiveBusinessId();
  if (!businessId) return { ok: false, error: new ValidationError("Create a business first.") };
  return { ok: true, userId: user.id, businessId };
}

export async function addCustomerAction(input: unknown): Promise<ActionResult<CustomerView>> {
  const ctx = await requireContext();
  if (!ctx.ok) return actionErr(ctx.error);

  const parsed = addSchema.safeParse(input);
  if (!parsed.success) {
    return actionErr(new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input."));
  }

  const { resolve } = await getServerContainer();
  const result = await resolve(TOKENS.AddCustomerUseCase).execute(ctx.userId, {
    businessId: ctx.businessId,
    name: parsed.data.name ?? null,
    phone: parsed.data.phone,
    consent: parsed.data.consent,
  });
  if (result.isOk()) revalidatePath("/app/customers");
  return toActionResult(result);
}

export async function deleteCustomerAction(customerId: string): Promise<ActionResult> {
  const ctx = await requireContext();
  if (!ctx.ok) return actionErr(ctx.error);
  if (!z.string().uuid().safeParse(customerId).success) {
    return actionErr(new ValidationError("Invalid customer."));
  }

  const { resolve } = await getServerContainer();
  const result = await resolve(TOKENS.DeleteCustomerUseCase).execute(ctx.userId, ctx.businessId, customerId);
  if (result.isOk()) revalidatePath("/app/customers");
  return toActionResult(result);
}

const importSchema = z.object({ csv: z.string().min(1, "Paste or upload a CSV.").max(2_000_000) });

export async function importCustomersAction(input: unknown): Promise<ActionResult<ImportReport>> {
  const ctx = await requireContext();
  if (!ctx.ok) return actionErr(ctx.error);

  const parsed = importSchema.safeParse(input);
  if (!parsed.success) {
    return actionErr(new ValidationError(parsed.error.issues[0]?.message ?? "Invalid input."));
  }
  const rows = csvToCustomerRows(parsed.data.csv);
  if (rows.length === 0) return actionErr(new ValidationError("No phone numbers found in that file."));
  if (rows.length > 5000) return actionErr(new ValidationError("Please import at most 5,000 rows at a time."));

  const { resolve } = await getServerContainer();
  const result = await resolve(TOKENS.ImportCustomersUseCase).execute(ctx.userId, ctx.businessId, rows);
  if (result.isOk()) revalidatePath("/app/customers");
  return toActionResult(result);
}
