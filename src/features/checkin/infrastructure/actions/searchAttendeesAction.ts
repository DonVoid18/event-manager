"use server";

import { prisma } from "@/shared/infrastructure/libs/prisma";
import { logServerError } from "@/shared/infrastructure/logging/serverLogger";
import { requireActiveSession } from "@/shared/infrastructure/utils/authorization";

export const searchAttendeesAction = async (eventId: string, query: string) => {
  try {
    await requireActiveSession();

    const term = query.trim();
    if (!eventId || term.length < 2) {
      return { success: true, data: [] };
    }

    const attendees = await prisma.attendee.findMany({
      where: {
        eventId,
        OR: [
          { documentId: { contains: term, mode: "insensitive" } },
          { firstName: { contains: term, mode: "insensitive" } },
          { lastName: { contains: term, mode: "insensitive" } },
          { email: { contains: term, mode: "insensitive" } },
          { invitation: { code: { contains: term, mode: "insensitive" } } },
        ],
      },
      include: { invitation: true, checkIn: true },
      orderBy: { firstName: "asc" },
      take: 20,
    });

    return {
      success: true,
      data: attendees.map((a) => ({
        id: a.id,
        firstName: a.firstName,
        lastName: a.lastName,
        documentId: a.documentId,
        email: a.email,
        invitationCode: a.invitation?.code ?? null,
        checkedIn: Boolean(a.checkIn),
        checkedInAt: a.checkIn?.checkedInAt ?? null,
      })),
    };
  } catch (error) {
    await logServerError({
      error,
      event: "checkin.search.failed",
      feature: "checkin",
      operation: "search_attendees",
      context: { eventId },
    });
    return { success: false, message: "No se pudo realizar la búsqueda.", data: [] };
  }
};
