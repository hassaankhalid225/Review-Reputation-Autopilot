"use client";

import * as React from "react";
import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Card } from "../card";
import { fadeUp } from "@/shared/motion/variants";

export function StatCard({
  label,
  value,
  delta,
  icon,
  suffix,
  className,
}: {
  label: string;
  value: string | number;
  /** Positive/negative percentage change vs previous period. */
  delta?: number;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
  className?: string;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <motion.div variants={fadeUp}>
      <Card className={cn("p-5", className)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-secondary">{label}</span>
          {icon && <span className="text-text-tertiary [&_svg]:size-4">{icon}</span>}
        </div>
        <div className="mt-3 flex items-end gap-2">
          <span className="text-3xl font-semibold tracking-tight tabular-nums text-text-primary">{value}</span>
          {suffix}
        </div>
        {delta !== undefined && (
          <div className="mt-2 flex items-center gap-1 text-xs font-medium">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5",
                positive ? "bg-success-bg text-success-fg" : "bg-danger-bg text-danger-fg",
              )}
            >
              {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
              {Math.abs(delta)}%
            </span>
            <span className="text-text-tertiary">vs last month</span>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
