import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { getSessionUser } from "@/features/auth/presentation/session";
import { getTenantContext } from "@/features/businesses/presentation/active-business";
import { BrandProfileForm } from "@/features/businesses/presentation/components/brand-profile-form";
import { PageHeader } from "@/shared/ui/patterns/page-header";
import { EmptyState } from "@/shared/ui/patterns/empty-state";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui/card";
import { Field } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getSessionUser();
  const { active } = await getTenantContext();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Your account and brand details." />

      <Card>
        <CardHeader>
          <CardTitle>Your account</CardTitle>
          <CardDescription>Personal details for your login.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <Input defaultValue={user?.displayName ?? ""} />
          </Field>
          <Field label="Email">
            <Input defaultValue={user?.email ?? ""} disabled />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brand</CardTitle>
          <CardDescription>
            Your business details, contact info, and brand identity. Reply voice and automation live
            on the AI Autopilot page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {active ? (
            <BrandProfileForm businessId={active.id} business={active} />
          ) : (
            <EmptyState
              icon={<Building2 />}
              title="No business yet"
              description="Create a business to set up your brand details."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
