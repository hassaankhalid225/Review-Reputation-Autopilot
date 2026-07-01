"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AlertCircle, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Field } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";
import { GoogleButton } from "./google-button";
import { signInAction, resendVerificationAction } from "../auth.actions";

const schema = z.object({
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(1, "Please enter your password."),
});
type Values = z.infer<typeof schema>;

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [showPw, setShowPw] = React.useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = React.useState<string | null>(null);
  const [resending, setResending] = React.useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  // Surface OAuth/callback errors passed back as ?error=
  const oauthError = params.get("error");
  React.useEffect(() => {
    if (oauthError) toast.error(decodeURIComponent(oauthError));
  }, [oauthError]);

  async function onSubmit(values: Values) {
    setUnconfirmedEmail(null);
    const result = await signInAction(values);
    if (result.ok) {
      toast.success("Welcome back!");
      router.push(params.get("next") ?? "/app");
      router.refresh();
    } else if (result.code === "EMAIL_NOT_CONFIRMED") {
      setUnconfirmedEmail(values.email);
      toast.error(result.message);
    } else {
      toast.error(result.message);
    }
  }

  async function onResend() {
    const email = unconfirmedEmail ?? getValues("email");
    if (!email) return;
    setResending(true);
    const result = await resendVerificationAction({ email });
    setResending(false);
    if (result.ok) toast.success("Verification email sent. Check your inbox.");
    else toast.error(result.message);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Welcome back</h1>
        <p className="text-sm text-text-secondary">Log in to your Reputation Autopilot dashboard.</p>
      </div>

      {unconfirmedEmail && (
        <div className="flex items-start gap-3 rounded-md border border-warning/30 bg-warning-bg p-3 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning-fg" />
          <div className="flex-1">
            <p className="font-medium text-warning-fg">Email not verified yet</p>
            <p className="mt-0.5 text-text-secondary">Verify {unconfirmedEmail} to log in.</p>
            <button
              type="button"
              onClick={onResend}
              disabled={resending}
              className="mt-1.5 font-medium text-primary hover:underline disabled:opacity-50"
            >
              {resending ? "Sending…" : "Resend verification email"}
            </button>
          </div>
        </div>
      )}

      <GoogleButton label="Log in with Google" />

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-text-tertiary">or</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@business.com"
            leadingIcon={<Mail />}
            invalid={!!errors.email}
            {...register("email")}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <Input
            id="password"
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            leadingIcon={<Lock />}
            invalid={!!errors.password}
            trailingIcon={
              <button type="button" onClick={() => setShowPw((s) => !s)} aria-label={showPw ? "Hide password" : "Show password"}>
                {showPw ? <EyeOff /> : <Eye />}
              </button>
            }
            {...register("password")}
          />
        </Field>

        <div className="flex justify-end">
          <Link href="/reset-password" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Log in
        </Button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up free
        </Link>
      </p>
    </div>
  );
}
