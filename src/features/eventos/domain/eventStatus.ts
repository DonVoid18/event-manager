export type EventStatus = "PROXIMO" | "HOY" | "FINALIZADO";

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  PROXIMO: "Próximo",
  HOY: "Hoy",
  FINALIZADO: "Finalizado",
};

/** Estado del evento calculado a partir de su fecha (no se almacena en la base de datos). */
export function getEventStatus(eventDate: Date | string, now: Date = new Date()): EventStatus {
  const date = new Date(eventDate);
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  if (now > endOfDay) return "FINALIZADO";
  if (now >= startOfDay) return "HOY";
  return "PROXIMO";
}
