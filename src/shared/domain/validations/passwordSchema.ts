import z from "zod";

export const PasswordSchema = z
  .string()
  .min(4, "La contraseña debe tener al menos 4 caracteres");
