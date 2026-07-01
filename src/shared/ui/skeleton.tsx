import { cn } from "@/shared/lib/cn";

/** Shimmer skeleton matching final layout — never a spinner on a blank screen. */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton-shimmer rounded-md bg-surface-2", className)}
      aria-hidden
      {...props}
    />
  );
}
