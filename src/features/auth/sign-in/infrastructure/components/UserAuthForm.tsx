"use client";

import { Button } from "@/shared/infrastructure/shadcn/components/ui/button";
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/shared/infrastructure/shadcn/components/ui/field";
import { Form, FormField } from "@/shared/infrastructure/shadcn/components/ui/form";
import { Input } from "@/shared/infrastructure/shadcn/components/ui/input";
import { FORGOT_PASSWORD_ROUTE } from "@/shared/infrastructure/utils/routes";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { SignIn, SignInSchema } from "../../domain/validations/signIn";
import { signInAction } from "../actions/signInAction";

export default function UserAuthForm() {
  const [loading, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const passwordReset = searchParams.get("passwordReset");

  const defaultValues = {
    email: "",
    password: "",
  };

  const form = useForm<SignIn>({
    resolver: zodResolver(SignInSchema),
    defaultValues,
  });

  const onSubmit = async (data: SignIn) => {
    setErrorMessage(null);
    startTransition(async () => {
      const response = await signInAction(data);

      if (!response.success) {
        setErrorMessage(response.message);
        return;
      }
    });
  };

  useEffect(() => {
    if (error) {
      setErrorMessage("Hubo un problema al iniciar sesión.");
    }
  }, [error]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold">Iniciar sesión</h1>
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
            name="password"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.error ? "true" : undefined}>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                  <a
                    href={FORGOT_PASSWORD_ROUTE}
                    className="ml-auto text-sm underline-offset-4 hover:underline text-muted-foreground"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <div className="relative w-full">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    disabled={loading}
                    className="bg-background pr-10"
                    placeholder="Ingresa tu contraseña"
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

          {errorMessage && (
            <p className="text-sm text-destructive font-medium text-center">
              {errorMessage}
            </p>
          )}
          {passwordReset === "success" && !errorMessage && (
            <p className="text-sm text-muted-foreground font-medium text-center">
              Tu contraseña fue actualizada. Inicia sesión nuevamente.
            </p>
          )}

          <Button disabled={loading} className="w-full cursor-pointer" type="submit">
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
        </FieldGroup>
      </form>
    </Form>
  );
}

