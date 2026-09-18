export type EventoType = "GRATUITO" | "PAGO";

export interface Evento {
  id: string;
  code: string;
  name: string;
  eventDate: Date;
  type: EventoType;
  capacity: number;
}

export interface EventoConMetricas extends Evento {
  registeredCount: number;
  checkedInCount: number;
}
