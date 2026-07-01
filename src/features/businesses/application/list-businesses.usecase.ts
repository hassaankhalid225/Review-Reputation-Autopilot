/** Use case: list every business the current user can access (RLS-scoped). */
import { Result } from "@/core/result/result";
import type { AppError } from "@/core/errors/app-error";
import type { BusinessRepository } from "../domain/business.repository";
import { type BusinessView, toBusinessView } from "./business.dto";

export class ListBusinessesUseCase {
  constructor(private readonly repo: BusinessRepository) {}

  async execute(): Promise<Result<BusinessView[], AppError>> {
    const result = await this.repo.listForCurrentUser();
    return result.map((list) => list.map(toBusinessView));
  }
}
