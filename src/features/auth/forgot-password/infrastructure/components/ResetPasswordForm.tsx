"use client";

import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/shared/infrastructure/shadcn/components/ui/field";
import { Form, FormField } from "@/shared/infrastructure/shadcn/components/ui/form";
import { SIGN_IN_ROUTE } from "@/shared/infrastructure/utils/routes";
import { Eye, EyeOff } from "lucide-react";
import { useState, useTransition } from "react";
import {
    ResetPassword,
    ResetPasswordSchema,
} from "../../domain/validations/forgotPassword";

import { Button } from "@/shared/infrastructure/shadcn/components/ui/button";
import { Input } from "@/shared/infrastructure/shadcn/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { resetPasswordAction } from "../actions/resetPasswordAction";

interface ResetPasswordFormProps {
  email?: string;
}

export default function ResetPasswordForm({ email = "" }: ResetPasswordFormProps) {
  const [loading, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPassword>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: {
      email,
      pin: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPassword) => {
    setErrorMessage(null);

    startTransition(async () => {
      const response = await resetPasswordAction(data);

      if (!response.success) {
        setErrorMessage(response.message);
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">Nueva contraseña</h1>
            <p className="text-sm text-muted-foreground">
              Ingresa el código recibido y define tu nueva contraseña.
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

          <FormField
            control={form.control}
            name="pin"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.error ? "true" : undefined}>
                <FieldLabel htmlFor="pin">Código de recuperación</FieldLabel>
                <Input
                  id="pin"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
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

          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.error ? "true" : undefined}>
                <FieldLabel htmlFor="password">Nueva contraseña</FieldLabel>
                <div className="relative w-full">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    disabled={loading}
                    className="bg-background pr-10"
                    placeholder="Ingresa tu nueva contraseña"
                    {...field}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </Field>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.error ? "true" : undefined}>
                <FieldLabel htmlFor="confirmPassword">
                  Confirmar contraseña
                </FieldLabel>
                <div className="relative w-full">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    disabled={loading}
                    className="bg-background pr-10"
                    placeholder="Repite tu nueva contraseña"
                    {...field}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                {fieldState.error && (
                  <FieldError>{fieldState.error.message}</FieldError>
                )}
              </Field>
            )}
          />

          {errorMessage && (
            <p className="text-sm text-destructive font-medium text-center">
              {errorMessage}
            </p>
          )}

          <Button disabled={loading} className="w-full cursor-pointer" type="submit">
            {loading ? "Actualizando..." : "Actualizar contraseña"}
          </Button>

          <FieldDescription className="text-center">
            <a href={SIGN_IN_ROUTE} className="underline underline-offset-4">
              Volver a iniciar sesión
            </a>
          </FieldDescription>
        </FieldGroup>
      </form>
    </Form>
  );
}
