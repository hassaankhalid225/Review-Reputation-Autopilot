import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Star,
  Send,
  Users,
  BellRing,
  Settings,
  CreditCard,
  Blocks,
  TrendingUp,
  BarChart3,
  Bot,
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
  { label: "AI Autopilot", href: "/app/autopilot", icon: Bot },
  { label: "Requests", href: "/app/requests", icon: Send },
  { label: "Customers", href: "/app/customers", icon: Users },
  { label: "Alerts", href: "/app/alerts", icon: BellRing, badge: "alerts" },
  { label: "Analytics", href: "/app/analytics", icon: BarChart3 },
  { label: "Grow", href: "/app/grow", icon: TrendingUp },
];

export const SECONDARY_NAV: NavItem[] = [
  { label: "Integrations", href: "/app/integrations", icon: Blocks },
  { label: "Billing", href: "/app/billing", icon: CreditCard },
  { label: "Settings", href: "/app/settings", icon: Settings },
];
