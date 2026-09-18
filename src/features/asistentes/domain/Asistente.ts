export type InvitationStatus = "PENDIENTE" | "ENVIADA" | "CONFIRMADA";

export interface AsistenteInvitacion {
  id: string;
  code: string;
  status: InvitationStatus;
  sentAt: Date | null;
}

export interface AsistenteCheckIn {
  id: string;
  checkedInAt: Date;
}

export interface Asistente {
  id: string;
  eventId: string;
  firstName: string;
  lastName: string;
  documentId: string;
  email: string;
  phone?: string | null;
  paymentAmount?: number | null;
  paymentReference?: string | null;
  paymentReceiptKey?: string | null;
  createdAt: Date;
  invitation?: AsistenteInvitacion | null;
  checkIn?: AsistenteCheckIn | null;
}
