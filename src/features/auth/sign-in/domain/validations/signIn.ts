import { EmailSchema } from "@/shared/domain/validations/emailSchema";
import { PasswordSchema } from "@/shared/domain/validations/passwordSchema";
import { z } from "zod";

export const SignInSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});

export type SignIn = z.infer<typeof SignInSchema>;
