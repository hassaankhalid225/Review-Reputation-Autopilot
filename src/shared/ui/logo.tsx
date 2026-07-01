import { cn } from "@/shared/lib/cn";
import { APP } from "@/core/config/constants";

/** Reputation Autopilot mark — a stylized upward star/spark in a rounded square. */
export function Logo({ className, withWordmark = true }: { className?: string; withWordmark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative grid size-8 place-items-center rounded-[10px] bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
        <svg viewBox="0 0 24 24" className="size-5 text-white" fill="none" aria-hidden>
          <path
            d="M12 2.5l2.6 5.7 6.2.6-4.7 4.1 1.4 6.1L12 15.9 6.5 19l1.4-6.1L3.2 8.8l6.2-.6L12 2.5z"
            fill="currentColor"
          />
        </svg>
      </span>
      {withWordmark && (
        <span className="text-[15px] font-semibold tracking-tight text-text-primary">{APP.name}</span>
      )}
    </span>
  );
}
