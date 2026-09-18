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
  tasaConfirmacion: number;
}

export interface ReportFilters {
  eventId?: string;
  from?: string;
  to?: string;
}
