"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Field } from "@/shared/ui/label";
import { Separator } from "@/shared/ui/separator";
import { scaleIn } from "@/shared/motion/variants";
import { GoogleButton } from "./google-button";
import { signUpAction } from "../auth.actions";

const schema = z.object({
  fullName: z.string().trim().min(1, "Please enter your name.").max(80),
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(8, "Use at least 8 characters."),
});
type Values = z.infer<typeof schema>;

export function SignUpForm() {
  const router = useRouter();
  const [showPw, setShowPw] = React.useState(false);
  const [submittedEmail, setSubmittedEmail] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { fullName: "", email: "", password: "" } });

  async function onSubmit(values: Values) {
    const result = await signUpAction(values);
    if (result.ok) {
      if (result.data.needsVerification) {
        setSubmittedEmail(values.email);
      } else {
        // Email confirmation disabled → user is already signed in.
        toast.success("Account created!");
        router.push("/onboarding");
        router.refresh();
      }
    } else {
      toast.error(result.message);
    }
  }

  if (submittedEmail) {
    return (
      <motion.div variants={scaleIn} initial="hidden" animate="show" className="space-y-4 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-success-bg text-success-fg">
          <CheckCircle2 className="size-7" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Check your inbox</h1>
        <p className="text-sm text-text-secondary">
          We sent a verification link to <span className="font-medium text-text-primary">{submittedEmail}</span>.
          Click it to activate your account and start collecting reviews.
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Back to log in</Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Start free trial</h1>
        <p className="text-sm text-text-secondary">14 days free. No credit card required.</p>
      </div>

      <GoogleButton label="Sign up with Google" />

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-text-tertiary">or</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="Hassaan Khalid"
            leadingIcon={<User />}
            invalid={!!errors.fullName}
            {...register("fullName")}
          />
        </Field>

        <Field label="Email" htmlFor="email" required error={errors.email?.message}>
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

        <Field label="Password" htmlFor="password" required hint="At least 8 characters." error={errors.password?.message}>
          <Input
            id="password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
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

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="text-center text-xs text-text-tertiary">
        By signing up you agree to our Terms and Privacy Policy.
      </p>
      <p className="text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
