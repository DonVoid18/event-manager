import { z } from "zod";

export const UpdateInvitationStatusSchema = z.object({
  status: z.enum(["PENDIENTE", "ENVIADA", "CONFIRMADA"], {
    message: "Selecciona un estado válido",
  }),
});

export type UpdateInvitationStatus = z.infer<typeof UpdateInvitationStatusSchema>;
