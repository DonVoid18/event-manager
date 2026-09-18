"use client";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/shared/infrastructure/shadcn/components/ui/field";
import { Form, FormField } from "@/shared/infrastructure/shadcn/components/ui/form";
import { Eye, EyeOff } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { SignUp, SignUpSchema } from "../../domain/validations/signUp";

import FooterExternalAuth from "@/shared/infrastructure/components/FooterExternalAuth";
import { Button } from "@/shared/infrastructure/shadcn/components/ui/button";
import { Input } from "@/shared/infrastructure/shadcn/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { signUpAction } from "../actions/signUpAction";

export default function UserRegisterForm() {
  const [loading, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const defaultValues = {
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  };

  const form = useForm<SignUp>({
    resolver: zodResolver(SignUpSchema),
    defaultValues,
  });

  const onSubmit = async (data: SignUp) => {
    setErrorMessage(null);
    startTransition(async () => {
      const response = await signUpAction(data);

      // Si hay un error, mostrarlo
      if (response && !response.success) {
        setErrorMessage(response.message);
        return;
      }

      // Si no hay respuesta, significa que hubo un redirect exitoso
      // (la función redirect() no retorna)
    });
  };

  useEffect(() => {
    if (error === "OAuthAccountNotLinked") {
      setErrorMessage(
        "Este correo ya está registrado. Inicia sesión con tu correo y contraseña."
      );
    } else if (error) {
      setErrorMessage("Hubo un problema al iniciar sesión.");
    }
  }, [error]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <FieldGroup>
          <FormField
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.error ? "true" : undefined}>
                <FieldLabel htmlFor="name">Nombre de usuario</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ingresar nombre de usuario"
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
            name="email"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.error ? "true" : undefined}>
                <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ingresar correo electrónico"
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
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <div className="relative w-full">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    disabled={loading}
                    className="bg-background pr-10"
                    placeholder="Ingresar contraseña"
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
                <FieldLabel htmlFor="confirmPassword">Confirmar Contraseña</FieldLabel>
                <div className="relative w-full">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    disabled={loading}
                    className="bg-background pr-10"
                    placeholder="Confirmar contraseña"
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
            {loading ? "Registrando..." : "Registrarme"}
          </Button>

          <FieldSeparator>O continuar con</FieldSeparator>

          <FooterExternalAuth />
        </FieldGroup>
      </form>
    </Form>
  );
}
