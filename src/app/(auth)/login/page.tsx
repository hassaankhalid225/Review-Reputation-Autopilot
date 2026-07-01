import { Suspense } from "react";
import type { Metadata } from "next";
import { SignInForm } from "@/features/auth/presentation/components/sign-in-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
