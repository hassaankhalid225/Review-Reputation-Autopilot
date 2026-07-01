import { redirect } from "next/navigation";
import { getSessionUser } from "@/features/auth/presentation/session";
import { getTenantContext } from "@/features/businesses/presentation/active-business";
import { getServerContainer } from "@/core/di/server";
import { TOKENS } from "@/core/di/tokens";
import { Sidebar } from "./_components/sidebar";
import { Topbar } from "./_components/topbar";
import { MobileNav } from "./_components/mobile-nav";
import { CompleteSetupGate } from "./_components/complete-setup-gate";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  // Defense in depth — middleware also guards, but never render the shell unauthenticated.
  if (!user) redirect("/login");

  // No business yet (e.g. onboarding skipped) → render the shell but gate the
  // workspace behind a "complete your details" nudge instead of the dashboard.
  const { businesses, active } = await getTenantContext();

  const topbarUser = { name: user.displayName, email: user.email, avatarUrl: user.avatarUrl };

  if (!active) {
    return (
      <div className="flex min-h-dvh">
        <Sidebar alertCount={0} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar user={topbarUser} businesses={[]} activeId={null} />
          <main className="flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-8">
            <div className="mx-auto w-full max-w-6xl">
              <CompleteSetupGate />
            </div>
          </main>
          <MobileNav />
        </div>
      </div>
    );
  }

  const { resolve } = await getServerContainer();
  const alertCountRes = await resolve(TOKENS.CountUnackedAlertsUseCase).execute(active.id);
  const alertCount = alertCountRes.isOk() ? alertCountRes.value : 0;

  return (
    <div className="flex min-h-dvh">
      <Sidebar alertCount={alertCount} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={topbarUser}
          businesses={businesses.map((b) => ({ id: b.id, name: b.name }))}
          activeId={active.id}
        />
        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
