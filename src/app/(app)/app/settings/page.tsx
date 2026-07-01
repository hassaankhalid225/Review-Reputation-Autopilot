import type { Metadata } from "next";
import { getSessionUser } from "@/features/auth/presentation/session";
import { getTenantContext } from "@/features/businesses/presentation/active-business";
import { BrandVoiceForm } from "@/features/businesses/presentation/components/brand-voice-form";
import { PageHeader } from "@/shared/ui/patterns/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui/card";
import { Field } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getSessionUser();
  const { active } = await getTenantContext();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your profile, brand voice, and preferences." />

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your personal account details.</CardDescription>
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
          <CardTitle>Brand voice</CardTitle>
          <CardDescription>How AI drafts your review replies.</CardDescription>
        </CardHeader>
        <CardContent>
          {active ? (
            <BrandVoiceForm businessId={active.id} current={active.brandTone} />
          ) : (
            <p className="text-sm text-text-tertiary">Create a business to set your brand voice.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
