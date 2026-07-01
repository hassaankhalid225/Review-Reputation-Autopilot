"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Check, ChevronRight } from "lucide-react";
import { Card } from "@/shared/ui/card";
import { cn } from "@/shared/lib/cn";
import { listItem, staggerContainer } from "@/shared/motion/variants";

interface Step {
  label: string;
  done: boolean;
  href: string;
}

/** Signature onboarding nudge (see Docs/USER_FLOW.md §16). */
export function ActivationChecklist({ steps }: { steps: Step[] }) {
  const done = steps.filter((s) => s.done).length;
  const pct = Math.round((done / steps.length) * 100);
  if (done === steps.length) return null;

  return (
    <Card className="overflow-hidden p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Finish setting up</h3>
          <p className="text-sm text-text-secondary">{done} of {steps.length} steps complete</p>
        </div>
        <span className="text-2xl font-semibold tabular-nums text-primary">{pct}%</span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        />
      </div>

      <motion.ul variants={staggerContainer(0.05)} initial="hidden" animate="show" className="mt-5 space-y-2">
        {steps.map((s) => (
          <motion.li key={s.label} variants={listItem}>
            <Link
              href={s.href}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-surface-2",
                s.done && "opacity-60",
              )}
            >
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border",
                  s.done ? "border-transparent bg-success text-white" : "border-border-strong text-text-tertiary",
                )}
              >
                {s.done && <Check className="size-3.5" />}
              </span>
              <span className={cn("flex-1 text-sm font-medium", s.done ? "text-text-secondary line-through" : "text-text-primary")}>
                {s.label}
              </span>
              {!s.done && <ChevronRight className="size-4 text-text-tertiary" />}
            </Link>
          </motion.li>
        ))}
      </motion.ul>
    </Card>
  );
}
