import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Star,
  Send,
  Users,
  BellRing,
  Settings,
  CreditCard,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: "alerts";
}

export const PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/app", icon: LayoutDashboard },
  { label: "Reviews", href: "/app/reviews", icon: Star },
  { label: "Requests", href: "/app/requests", icon: Send },
  { label: "Customers", href: "/app/customers", icon: Users },
  { label: "Alerts", href: "/app/alerts", icon: BellRing, badge: "alerts" },
];

export const SECONDARY_NAV: NavItem[] = [
  { label: "Billing", href: "/app/billing", icon: CreditCard },
  { label: "Settings", href: "/app/settings", icon: Settings },
];
