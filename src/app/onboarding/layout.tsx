import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getSessionUser } from "@/features/auth/presentation/session";
import { Logo } from "@/shared/ui/logo";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { Button } from "@/shared/ui/button";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex h-16 items-center justify-between px-5 sm:px-8">
        <Logo />
        <div className="flex items-center gap-1.5">
          {/* Skip onboarding for now — the dashboard stays locked until details are added. */}
          <Button asChild variant="ghost" size="sm">
            <Link href="/app">
              Skip for now
              <ArrowRight />
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-5 py-8 sm:items-center">
        <div className="w-full max-w-xl">{children}</div>
      </main>
    </div>
  );
}
