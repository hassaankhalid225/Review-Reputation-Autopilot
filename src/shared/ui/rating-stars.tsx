"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/shared/lib/cn";

const sizeMap = { sm: "size-3.5", md: "size-4", lg: "size-6" } as const;

/**
 * Rating display + optional interactive picker.
 * Supports fractional display (e.g. 4.6) via a clip overlay.
 */
export function RatingStars({
  value,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
  className,
}: {
  value: number;
  max?: number;
  size?: keyof typeof sizeMap;
  interactive?: boolean;
  onChange?: (value: number) => void;
  className?: string;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  const shown = hover ?? value;

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={`${value} out of ${max} stars`}
      onMouseLeave={() => interactive && setHover(null)}
    >
      {Array.from({ length: max }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, shown - i));
        const star = (
          <span className="relative inline-block">
            <Star className={cn(sizeMap[size], "text-border")} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={cn(sizeMap[size], "fill-star text-star")} />
            </span>
          </span>
        );
        return interactive ? (
          <button
            key={i}
            type="button"
            className="cursor-pointer rounded-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onMouseEnter={() => setHover(i + 1)}
            onClick={() => onChange?.(i + 1)}
            aria-label={`${i + 1} stars`}
          >
            {star}
          </button>
        ) : (
          <span key={i}>{star}</span>
        );
      })}
    </div>
  );
}
