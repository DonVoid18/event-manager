import { z } from "zod";

export const CreateEventoSchema = z.object({
  name: z.string().trim().min(1, "El nombre del evento es obligatorio").max(150),
  eventDate: z.string().min(1, "La fecha y hora del evento son obligatorias"),
  type: z.enum(["GRATUITO", "PAGO"], {
    message: "Selecciona el tipo de evento",
  }),
  capacity: z
    .number({ message: "El aforo máximo es obligatorio" })
    .int("El aforo debe ser un número entero")
    .positive("El aforo máximo debe ser mayor a 0"),
});

export type CreateEvento = z.infer<typeof CreateEventoSchema>;
