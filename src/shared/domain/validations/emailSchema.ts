import z from "zod";

export const EmailSchema = z
  .email("El correo electrónico no es válido")
  .min(1, "El correo electrónico es obligatorio");
