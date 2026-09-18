import { z } from "zod";

const documentIdField = z
  .string()
  .trim()
  .min(3, "El documento de identidad es obligatorio")
  .max(20, "El documento de identidad no es válido");

export const BaseAsistenteSchema = z.object({
  firstName: z.string().trim().min(1, "El nombre es obligatorio").max(80),
  lastName: z.string().trim().min(1, "El apellido es obligatorio").max(80),
  documentId: documentIdField,
  email: z.string().trim().min(1, "El correo electrónico es obligatorio").email("Correo electrónico inválido"),
  phone: z
    .string()
    .trim()
    .max(20, "El teléfono no es válido")
    .optional()
    .or(z.literal("")),
});

export const PaidAsistenteSchema = BaseAsistenteSchema.extend({
  paymentAmount: z
    .number({ message: "El monto pagado es obligatorio" })
    .positive("El monto debe ser mayor a 0"),
  paymentReference: z
    .string()
    .trim()
    .min(1, "La referencia del comprobante de pago es obligatoria")
    .max(80),
});

export function getAsistenteSchema(eventType: "GRATUITO" | "PAGO") {
  return eventType === "PAGO" ? PaidAsistenteSchema : BaseAsistenteSchema;
}

export type CreateAsistenteBase = z.infer<typeof BaseAsistenteSchema>;
export type CreateAsistentePago = z.infer<typeof PaidAsistenteSchema>;
export type CreateAsistente = CreateAsistenteBase & Partial<Pick<CreateAsistentePago, "paymentAmount" | "paymentReference">>;
