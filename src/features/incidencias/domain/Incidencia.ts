export type IncidentCategory = "ACCESO" | "DOCUMENTACION" | "PAGO" | "TECNICA" | "OTRO";

export interface Incidencia {
  id: string;
  eventId: string;
  attendeeId: string | null;
  description: string;
  category: IncidentCategory;
  occurredAt: Date;
  attendee?: { firstName: string; lastName: string } | null;
}
