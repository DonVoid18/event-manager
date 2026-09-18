import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/infrastructure/libs/prisma";
import { ReportFilters, ReportRow, ReportSummary } from "../../domain/ReportRow";

export async function getReportData(filters: ReportFilters) {
  const eventWhere: Prisma.EventWhereInput = {
    ...(filters.eventId ? { id: filters.eventId } : {}),
    ...(filters.from || filters.to
      ? {
        eventDate: {
          ...(filters.from ? { gte: new Date(filters.from) } : {}),
          ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59`) } : {}),
        },
      }
      : {}),
  };

  const events = await prisma.event.findMany({
    where: eventWhere,
    include: {
      attendees: { include: { invitation: true, checkIn: true } },
    },
    orderBy: { eventDate: "desc" },
  });

  const rows: ReportRow[] = events.flatMap((event) =>
    event.attendees.map((a) => ({
      eventId: event.id,
      eventCode: event.code,
      eventName: event.name,
      eventDate: event.eventDate,
      eventType: event.type,
      attendeeId: a.id,
      firstName: a.firstName,
      lastName: a.lastName,
      documentId: a.documentId,
      email: a.email,
      registeredAt: a.createdAt,
      invitationStatus: a.invitation?.status ?? null,
      invitationSentAt: a.invitation?.sentAt ?? null,
      checkedInAt: a.checkIn?.checkedInAt ?? null,
    }))
  );

  const totalCheckins = rows.filter((r) => r.checkedInAt).length;

  const summary: ReportSummary = {
    totalEventos: events.length,
    totalAsistentes: rows.length,
    totalCheckins,
    tasaConfirmacion: rows.length ? totalCheckins / rows.length : 0,
  };

  return { rows, summary };
}
