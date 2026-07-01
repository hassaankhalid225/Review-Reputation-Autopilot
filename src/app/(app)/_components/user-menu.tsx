"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings, User as UserIcon } from "lucide-react";
import { Avatar } from "@/shared/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { signOutAction } from "@/features/auth/presentation/auth.actions";

export function UserMenu({
  name,
  email,
  avatarUrl,
}: {
  name: string;
  email: string;
  avatarUrl?: string | null;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-full p-0.5 outline-none transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar name={name} src={avatarUrl} className="size-8" />
        <ChevronDown className="size-4 text-text-tertiary" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="text-sm font-medium text-text-primary">{name}</p>
          <p className="truncate text-xs text-text-tertiary">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app/settings">
            <UserIcon /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/app/settings">
            <Settings /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={signOutAction}>
          <DropdownMenuItem
            destructive
            asChild
            onSelect={(e) => {
              e.preventDefault();
              (e.currentTarget as HTMLElement).closest("form")?.requestSubmit();
            }}
          >
            <button type="submit" className="w-full">
              <LogOut /> Log out
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
