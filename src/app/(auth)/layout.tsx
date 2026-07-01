import Link from "next/link";
import { Logo } from "@/shared/ui/logo";
import { RatingStars } from "@/shared/ui/rating-stars";

/** Premium split-screen auth layout: form on the left, brand story on the right. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Form side */}
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Link href="/" className="inline-flex w-fit">
          <Logo />
        </Link>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <p className="text-center text-xs text-text-tertiary">
          © {new Date().getFullYear()} Reputation Autopilot
        </p>
      </div>

      {/* Brand side */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 lg:block">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-10" />
        <div className="pointer-events-none absolute right-[-10%] top-[-10%] size-[480px] rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div />
          <div className="space-y-6">
            <RatingStars value={5} size="lg" className="[&_svg]:fill-white [&_svg]:text-white" />
            <blockquote className="text-2xl font-medium leading-snug">
              “We went from 30 reviews to over 200 in two months. Customers actually reply now — and we
              catch every bad review before it sits there.”
            </blockquote>
            <div>
              <p className="font-semibold">Bilal Ahmed</p>
              <p className="text-sm text-white/70">Owner, Spice Route Restaurant — Lahore</p>
            </div>
          </div>
          <div className="flex items-center gap-8 text-sm text-white/70">
            <div>
              <p className="text-2xl font-semibold text-white">4.8★</p>
              <p>Avg. rating lift</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">3×</p>
              <p>More reviews</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">&lt;2min</p>
              <p>Bad-review alerts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
