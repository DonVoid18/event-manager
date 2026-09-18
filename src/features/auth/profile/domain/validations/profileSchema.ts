import { z } from "zod";
import { EmailSchema } from "@/shared/domain/validations/emailSchema";
import { PasswordSchema } from "@/shared/domain/validations/passwordSchema";

export const UpdateProfileSchema = z
  .object({
    name: z
      .string()
      .min(2, "El nombre debe tener al menos 2 caracteres")
      .max(50, "El nombre es demasiado largo"),
    email: EmailSchema,
    image: z.string().url("La URL de la imagen no es válida").or(z.literal("")).optional(),
    currentPassword: z.string().optional(),
    newPassword: PasswordSchema.or(z.literal("")).optional(),
    confirmNewPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.newPassword && data.newPassword.length > 0) {
        return data.newPassword === data.confirmNewPassword;
      }
      return true;
    },
    {
      message: "Las contraseñas no coinciden",
      path: ["confirmNewPassword"],
    }
  );

export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
