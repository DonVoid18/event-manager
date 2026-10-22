import "server-only";

import { Prisma } from "@prisma/client";
import { prisma } from "@/shared/infrastructure/libs/prisma";
import {
  ReportEventSummary,
  ReportFilters,
  ReportRow,
  ReportSummary,
} from "../../domain/ReportRow";

export async function getReportData(filters: ReportFilters) {
  const eventWhere: Prisma.EventWhereInput = {
    ...(filters.eventId ? { id: filters.eventId } : {}),
    ...(filters.eventType ? { type: filters.eventType } : {}),
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
      _count: { select: { incidents: true } },
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

  const byEvent: ReportEventSummary[] = events.map((event) => ({
    eventId: event.id,
    eventCode: event.code,
    eventName: event.name,
    eventDate: event.eventDate,
    capacity: event.capacity,
    registrados: event.attendees.length,
    invitados: event.attendees.filter((a) => a.invitation && a.invitation.status !== "PENDIENTE").length,
    asistentes: event.attendees.filter((a) => a.checkIn).length,
    incidencias: event._count.incidents,
  }));

  const totalCheckins = rows.filter((r) => r.checkedInAt).length;

  const summary: ReportSummary = {
    totalEventos: events.length,
    totalAsistentes: rows.length,
    totalCheckins,
    tasaConfirmacion: rows.length ? totalCheckins / rows.length : 0,
    invitacionesEnviadas: rows.filter((r) => r.invitationStatus && r.invitationStatus !== "PENDIENTE").length,
    invitacionesConfirmadas: rows.filter((r) => r.invitationStatus === "CONFIRMADA").length,
    totalIncidencias: byEvent.reduce((acc, e) => acc + e.incidencias, 0),
  };

  return { rows, summary, byEvent };
}
