"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/shared/infrastructure/shadcn/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/shared/infrastructure/shadcn/components/ui/input-otp";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/shared/infrastructure/shadcn/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { VerifyEmailSchema } from "../../domain/validations/verifyEmail";
import { resendCodeAction } from "../actions/resendCodeAction";
import { verifyEmailAction } from "../actions/verifyEmailAction";

const VerifyEmailPage = () => {
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [loading, startTransition] = useTransition();
  const [resendCodeLoading, startTransitionResendCode] = useTransition();

  const form = useForm<z.infer<typeof VerifyEmailSchema>>({
    resolver: zodResolver(VerifyEmailSchema),
    defaultValues: {
      pin: "",
    },
  });
  function onSubmit(data: z.infer<typeof VerifyEmailSchema>) {
    startTransition(async () => {
      const response = await verifyEmailAction(data);

      if (!response.success) {
        toast.error(response.message);
        return;
      }
    });
  }

  // Timer para el reenvío
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleResend = async () => {
    if (!canResend) return;

    setCanResend(false);
    setResendTimer(30);

    startTransitionResendCode(async () => {
      const response = await resendCodeAction();

      if (!response.success) {
        toast.error(response.message);
        return;
      }

      toast.success(response.message);
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col justify-center items-center gap-4"
        >
          <h1 className="text-2xl font-semibold text-center">
            Verificar correo electrónico
          </h1>
          <p className="text-xs opacity-50 text-center">
            Ingresa el código de verificación enviado a tu
            <Link
              target="_blank"
              href="https://mail.google.com/mail/u/0/#inbox"
              className="font-medium ml-1 underline"
            >
              correo electrónico.
            </Link>
          </p>
          <div className="flex gap-4 flex-col">
            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <InputOTP maxLength={6} {...field} disabled={loading}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={!form.formState.isValid || loading}>
              Confirmar
            </Button>
          </div>
          <div className="text-center space-y-2">
            <Button
              variant="ghost"
              onClick={handleResend}
              disabled={!canResend || loading || resendCodeLoading}
            >
              {canResend ? "Reenviar código" : `Reenviar en ${resendTimer}s`}
            </Button>
          </div>
          <Button
            variant="link"
            className="text-sm text-muted-foreground"
            onClick={async () => await signOut()}
            type="button"
          >
            Iniciar con otra cuenta
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default VerifyEmailPage;
