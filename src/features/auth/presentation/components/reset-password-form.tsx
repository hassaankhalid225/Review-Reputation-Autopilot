"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Field } from "@/shared/ui/label";
import { scaleIn } from "@/shared/motion/variants";
import { requestPasswordResetAction } from "../auth.actions";

const schema = z.object({ email: z.string().email("Please enter a valid email.") });
type Values = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const [sent, setSent] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  async function onSubmit(values: Values) {
    const result = await requestPasswordResetAction(values);
    if (result.ok) setSent(true);
    else toast.error(result.message);
  }

  if (sent) {
    return (
      <motion.div variants={scaleIn} initial="hidden" animate="show" className="space-y-4 text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-success-bg text-success-fg">
          <MailCheck className="size-7" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Reset link sent</h1>
        <p className="text-sm text-text-secondary">
          If an account exists for that email, you&apos;ll receive a link to reset your password.
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
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Reset your password</h1>
        <p className="text-sm text-text-secondary">Enter your email and we&apos;ll send you a reset link.</p>
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
        <Button type="submit" className="w-full" size="lg" loading={isSubmitting}>
          Send reset link
        </Button>
      </form>

      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary">
        <ArrowLeft className="size-4" /> Back to log in
      </Link>
    </div>
  );
}
