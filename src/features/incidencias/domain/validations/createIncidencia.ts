import { z } from "zod";

export const CreateIncidenciaSchema = z.object({
  description: z.string().trim().min(5, "Describe la incidencia con al menos 5 caracteres").max(500),
  category: z.enum(["ACCESO", "DOCUMENTACION", "PAGO", "TECNICA", "OTRO"], {
    message: "Selecciona una categoría",
  }),
  attendeeId: z.string().trim().optional().or(z.literal("")),
});

export type CreateIncidencia = z.infer<typeof CreateIncidenciaSchema>;

export const INCIDENT_CATEGORY_LABELS: Record<string, string> = {
  ACCESO: "Acceso",
  DOCUMENTACION: "Documentación",
  PAGO: "Pago",
  TECNICA: "Técnica",
  OTRO: "Otro",
};
