import z from "zod";
import { EmailSchema } from "@/shared/domain/validations/emailSchema";
import { PasswordSchema } from "@/shared/domain/validations/passwordSchema";

export const ForgotPasswordSchema = z.object({
  email: EmailSchema,
});

export const ResetPasswordSchema = z
  .object({
    email: EmailSchema,
    pin: z.string().min(6, {
      message: "Tu código de recuperación debe tener 6 caracteres.",
    }),
    password: PasswordSchema,
    confirmPassword: PasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

export type ForgotPassword = z.infer<typeof ForgotPasswordSchema>;
export type ResetPassword = z.infer<typeof ResetPasswordSchema>;
