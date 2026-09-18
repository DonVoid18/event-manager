import { EmailSchema } from "@/shared/domain/validations/emailSchema";
import { PasswordSchema } from "@/shared/domain/validations/passwordSchema";
import { z } from "zod";

export const CreateUsuarioSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(60, "El nombre es muy largo"),
  email: EmailSchema,
  password: PasswordSchema,
  role: z.enum(["ADMIN", "COLABORADOR"], { message: "Selecciona un rol" }),
});

export type CreateUsuario = z.infer<typeof CreateUsuarioSchema>;
