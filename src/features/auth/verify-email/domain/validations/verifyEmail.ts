import z from "zod";

export const VerifyEmailSchema = z.object({
  pin: z.string().min(6, {
    message: "Tu código de verificación debe tener 6 caracteres.",
  }),
});

export type VerifyEmail = z.infer<typeof VerifyEmailSchema>;
