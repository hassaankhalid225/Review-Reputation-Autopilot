"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/shared/ui/logo";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/cn";
import { PRIMARY_NAV, SECONDARY_NAV, type NavItem } from "./nav-config";

function isActive(pathname: string, href: string): boolean {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({ item, alertCount }: { item: NavItem; alertCount?: number }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-surface-2 text-text-primary"
          : "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
      )}
      <item.icon className={cn("size-[18px]", active ? "text-primary" : "text-text-tertiary group-hover:text-text-secondary")} />
      <span className="flex-1">{item.label}</span>
      {item.badge === "alerts" && alertCount ? (
        <Badge variant="danger" className="px-1.5 py-0">
          {alertCount}
        </Badge>
      ) : null}
    </Link>
  );
}

export function Sidebar({ alertCount = 0 }: { alertCount?: number }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 items-center px-5">
        <Link href="/app">
          <Logo />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} alertCount={alertCount} />
        ))}
        <div className="my-3 h-px bg-border" />
        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
      <div className="p-3">
        <div className="rounded-lg border border-border bg-surface-2 p-3">
          <p className="text-xs font-medium text-text-primary">Free trial</p>
          <p className="mt-0.5 text-xs text-text-tertiary">12 days left</p>
          <Link
            href="/app/billing"
            className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
          >
            Upgrade plan →
          </Link>
        </div>
      </div>
    </aside>
  );
}
