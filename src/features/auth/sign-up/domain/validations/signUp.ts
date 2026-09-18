import { EmailSchema } from "@/shared/domain/validations/emailSchema";
import { PasswordSchema } from "@/shared/domain/validations/passwordSchema";
import { z } from "zod";

export const SignUpSchema = z
  .object({
    name: z
      .string()
      .min(2, { message: "El nombre es muy corto" })
      .max(20, { message: "El nombre es muy largo" })
      .nonempty({ message: "El nombre es obligatorio" }),
    email: EmailSchema,
    password: PasswordSchema,
    confirmPassword: PasswordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type SignUp = z.infer<typeof SignUpSchema>;
