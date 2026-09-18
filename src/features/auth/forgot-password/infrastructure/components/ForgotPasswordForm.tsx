"use client";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/infrastructure/shadcn/components/ui/field";
import { Form, FormField } from "@/shared/infrastructure/shadcn/components/ui/form";
import {
  RESET_PASSWORD_ROUTE,
  SIGN_IN_ROUTE,
} from "@/shared/infrastructure/utils/routes";
import { useState, useTransition } from "react";
import {
  ForgotPassword,
  ForgotPasswordSchema,
} from "../../domain/validations/forgotPassword";

import { Button } from "@/shared/infrastructure/shadcn/components/ui/button";
import { Input } from "@/shared/infrastructure/shadcn/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { requestPasswordResetAction } from "../actions/requestPasswordResetAction";

export default function ForgotPasswordForm() {
  const [loading, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<ForgotPassword>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPassword) => {
    setMessage(null);
    setErrorMessage(null);

    startTransition(async () => {
      const response = await requestPasswordResetAction(data);

      if (!response.success) {
        setErrorMessage(response.message);
        return;
      }

      setMessage(response.message);
      router.push(
        `${RESET_PASSWORD_ROUTE}?email=${encodeURIComponent(data.email)}`
      );
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">Recuperar contraseña</h1>
            <p className="text-sm text-muted-foreground">
              Ingresa tu correo para recibir un código de recuperación.
            </p>
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.error ? "true" : undefined}>
                <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ingresa tu correo"
                  disabled={loading}
                  className="bg-background"
                  {...field}
                />
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </Field>
            )}
          />

          {message && (
            <p className="text-sm text-muted-foreground font-medium text-center">
              {message}
            </p>
          )}
          {errorMessage && (
            <p className="text-sm text-destructive font-medium text-center">
              {errorMessage}
            </p>
          )}

          <Button disabled={loading} className="w-full cursor-pointer" type="submit">
            {loading ? "Enviando código..." : "Enviar código"}
          </Button>

          <FieldDescription className="text-center">
            ¿Recordaste tu contraseña?{" "}
            <a href={SIGN_IN_ROUTE} className="underline underline-offset-4">
              Iniciar sesión
            </a>
          </FieldDescription>
        </FieldGroup>
      </form>
    </Form>
  );
}
