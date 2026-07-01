/** Maps a Supabase auth user into the domain User entity. */
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { User } from "../domain/user.entity";

export function mapSupabaseUser(u: SupabaseUser): User {
  const meta = u.user_metadata ?? {};
  return User.create({
    id: u.id,
    email: u.email ?? "",
    fullName: (meta.full_name as string | undefined) ?? (meta.name as string | undefined) ?? null,
    emailVerified: Boolean(u.email_confirmed_at ?? u.confirmed_at),
    avatarUrl: (meta.avatar_url as string | undefined) ?? null,
  });
}
