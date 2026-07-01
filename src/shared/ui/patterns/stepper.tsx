"use client";

import { Check } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold transition-colors",
                done && "border-transparent bg-primary text-white",
                active && "border-primary text-primary",
                !done && !active && "border-border text-text-tertiary",
              )}
            >
              {done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                "hidden text-sm font-medium sm:block",
                active ? "text-text-primary" : "text-text-tertiary",
              )}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <span className={cn("h-px flex-1 transition-colors", done ? "bg-primary" : "bg-border")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
