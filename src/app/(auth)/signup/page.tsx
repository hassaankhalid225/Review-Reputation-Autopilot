import type { Metadata } from "next";
import { SignUpForm } from "@/features/auth/presentation/components/sign-up-form";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return <SignUpForm />;
}
