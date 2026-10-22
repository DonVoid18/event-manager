export interface ReportRow {
  eventId: string;
  eventCode: string;
  eventName: string;
  eventDate: Date;
  eventType: "GRATUITO" | "PAGO";
  attendeeId: string;
  firstName: string;
  lastName: string;
  documentId: string;
  email: string;
  registeredAt: Date;
  invitationStatus: "PENDIENTE" | "ENVIADA" | "CONFIRMADA" | null;
  invitationSentAt: Date | null;
  checkedInAt: Date | null;
}

export interface ReportSummary {
  totalEventos: number;
  totalAsistentes: number;
  totalCheckins: number;
  /** Proporción de asistentes registrados que ingresaron al evento. */
  tasaConfirmacion: number;
  invitacionesEnviadas: number;
  invitacionesConfirmadas: number;
  totalIncidencias: number;
}

export interface ReportEventSummary {
  eventId: string;
  eventCode: string;
  eventName: string;
  eventDate: Date;
  capacity: number;
  registrados: number;
  invitados: number;
  asistentes: number;
  incidencias: number;
}

export type ReportTipo = "REGISTRO" | "INVITACIONES" | "CHECKIN";
export const REPORT_TIPOS: ReportTipo[] = ["REGISTRO", "INVITACIONES", "CHECKIN"];

export interface ReportFilters {
  eventId?: string;
  from?: string;
  to?: string;
  eventType?: "GRATUITO" | "PAGO";
}
