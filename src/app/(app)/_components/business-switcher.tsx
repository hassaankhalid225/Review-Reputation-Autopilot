"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Plus, Store } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { switchBusinessAction } from "@/features/businesses/presentation/business.actions";

export interface SwitcherBusiness {
  id: string;
  name: string;
}

/** Multi-business switcher (FR-AUTH-3), wired to real memberships. */
export function BusinessSwitcher({
  businesses,
  activeId,
}: {
  businesses: SwitcherBusiness[];
  activeId: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const active = businesses.find((b) => b.id === activeId) ?? businesses[0];

  function select(id: string) {
    if (id === activeId) return;
    startTransition(async () => {
      await switchBusinessAction(id);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-text-primary outline-none transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      >
        <span className="grid size-7 place-items-center rounded-md bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
          <Store className="size-4" />
        </span>
        <span className="max-w-[12rem] truncate">{active?.name ?? "My Business"}</span>
        <ChevronsUpDown className="size-4 text-text-tertiary" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Your businesses</DropdownMenuLabel>
        {businesses.map((b) => (
          <DropdownMenuItem key={b.id} onClick={() => select(b.id)}>
            <span className="grid size-6 place-items-center rounded bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
              <Store className="size-3.5" />
            </span>
            <span className="flex-1 truncate">{b.name}</span>
            {b.id === active?.id && <Check className="size-4 text-primary" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/onboarding")}>
          <Plus /> Add business
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
