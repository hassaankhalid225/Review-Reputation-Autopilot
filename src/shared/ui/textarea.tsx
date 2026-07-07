"use client";

import * as React from "react";
import { cn } from "@/shared/lib/cn";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        "flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary",
        "shadow-xs transition-[border,box-shadow] duration-150 placeholder:text-text-tertiary",
        "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30",
        "disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-20",
        invalid && "border-danger focus-visible:border-danger focus-visible:ring-danger/30",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
