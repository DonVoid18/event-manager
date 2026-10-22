"use server";

import { prisma } from "@/shared/infrastructure/libs/prisma";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";
import { requireActiveSession } from "@/shared/infrastructure/utils/authorization";

export interface CheckinStats {
  registered: number;
  checkedIn: number;
  incidents: number;
  capacity: number;
  recent: { id: string; name: string; checkedInAt: Date }[];
}

/** Resumen del control de acceso de un evento: asistentes, ingresos e incidencias. */
export const getCheckinStatsAction = async (eventId: string) => {
  try {
    await requireActiveSession();

    const [event, registered, checkedIn, incidents, recent] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId }, select: { capacity: true } }),
      prisma.attendee.count({ where: { eventId } }),
      prisma.checkIn.count({ where: { attendee: { eventId } } }),
      prisma.incident.count({ where: { eventId } }),
      prisma.checkIn.findMany({
        where: { attendee: { eventId } },
        orderBy: { checkedInAt: "desc" },
        take: 6,
        include: { attendee: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    if (!event) {
      return { success: false as const, message: "El evento no existe" };
    }

    const data: CheckinStats = {
      registered,
      checkedIn,
      incidents,
      capacity: event.capacity,
      recent: recent.map((c) => ({
        id: c.id,
        name: `${c.attendee.firstName} ${c.attendee.lastName}`,
        checkedInAt: c.checkedInAt,
      })),
    };

    return { success: true as const, data };
  } catch (error) {
    await logServerError({
      error,
      event: "checkin.stats.failed",
      feature: "checkin",
      operation: "get_checkin_stats",
      context: { eventId },
    });
    return { success: false as const, message: "No se pudo obtener el resumen del evento." };
  }
};
