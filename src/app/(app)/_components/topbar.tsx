"use client";

import * as React from "react";
import { Bell, Search, Command } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { UserMenu } from "./user-menu";
import { BusinessSwitcher, type SwitcherBusiness } from "./business-switcher";

export function Topbar({
  user,
  businesses,
  activeId,
}: {
  user: { name: string; email: string; avatarUrl?: string | null };
  businesses: SwitcherBusiness[];
  activeId: string | null;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      <BusinessSwitcher businesses={businesses} activeId={activeId} />

      {/* Command-palette style search */}
      <button className="ml-auto hidden items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-tertiary transition-colors hover:border-border-strong sm:flex">
        <Search className="size-4" />
        <span>Search…</span>
        <kbd className="ml-4 inline-flex items-center gap-0.5 rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-text-tertiary">
          <Command className="size-3" />K
        </kbd>
      </button>

      <Button variant="ghost" size="icon" aria-label="Notifications" className="relative sm:ml-0 ml-auto">
        <Bell className="size-[18px]" />
        <span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-danger" />
      </Button>
      <ThemeToggle />
      <div className="mx-1 h-6 w-px bg-border" />
      <UserMenu name={user.name} email={user.email} avatarUrl={user.avatarUrl} />
    </header>
  );
}
