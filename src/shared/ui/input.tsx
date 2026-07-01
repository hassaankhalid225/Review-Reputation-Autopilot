"use client";

import * as React from "react";
import { cn } from "@/shared/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, leadingIcon, trailingIcon, invalid, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leadingIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary [&_svg]:size-4">
            {leadingIcon}
          </span>
        )}
        <input
          type={type}
          ref={ref}
          aria-invalid={invalid || undefined}
          className={cn(
            "flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary",
            "shadow-xs transition-[border,box-shadow] duration-150 placeholder:text-text-tertiary",
            "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            leadingIcon && "pl-9",
            trailingIcon && "pr-9",
            invalid && "border-danger focus-visible:border-danger focus-visible:ring-danger/30",
            className,
          )}
          {...props}
        />
        {trailingIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary [&_svg]:size-4">
            {trailingIcon}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
