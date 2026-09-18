import { EmailSchema } from "@/shared/domain/validations/emailSchema";
import { z } from "zod";

export const UpdateUsuarioSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(60, "El nombre es muy largo"),
  email: EmailSchema,
  role: z.enum(["ADMIN", "COLABORADOR"], { message: "Selecciona un rol" }),
});

export type UpdateUsuario = z.infer<typeof UpdateUsuarioSchema>;
