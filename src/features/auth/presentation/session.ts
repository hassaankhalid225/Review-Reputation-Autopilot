import "server-only";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import type { User } from "../domain/user.entity";

/** Read the current authenticated user on the server (RLS-scoped). */
export async function getSessionUser(): Promise<User | null> {
  const { resolve } = await getServerContainer();
  return resolve(TOKENS.AuthRepository).getCurrentUser();
}
