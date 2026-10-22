import { config } from "dotenv";
import { expand } from "dotenv-expand";

import { buildResearchDemoPlan, validateResearchDemoPlan } from "./seeds/research-demo-plan";

const plans = buildResearchDemoPlan();
validateResearchDemoPlan(plans);

async function main() {
  if (!process.argv.includes("--apply")) {
    console.log("Plan de demostración: 50 eventos, 3948 asistentes, 3384 invitaciones enviadas y 3291 ingresos.");
    console.log("Periodo: 09/01/2026 al 09/09/2026. Todos los registros llevarán identificadores DEMO.");
    console.log("Para aplicarlo a una base autorizada y respaldada, ejecuta con --apply.");
    return;
  }

  expand(config());
  const { prisma } = await import("../src/shared/infrastructure/libs/prisma");

  const originalEvents = new Map([
    ["EVT-WNSPBD", { name: "Conferencia Anual TUMITECH 2026", attendees: 4 }],
    ["EVT-V7ZNBS", { name: "Workshop de Ciberseguridad Empresarial", attendees: 3 }],
    ["EVT-PBDRGA", { name: "Meetup de Desarrolladores TUMITECH", attendees: 5 }],
    ["EVT-54FWBK", { name: "Curso Avanzado de Cloud Computing", attendees: 3 }],
  ]);

  const chunk = <T,>(items: T[], size = 500) =>
    Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));

  try {
    await prisma.$transaction(async (tx) => {
      const events = await tx.event.findMany({
        select: { id: true, code: true, name: true, _count: { select: { attendees: true } } },
      });
      const alreadyApplied = events.length === plans.length &&
        events.every((event) => {
          const plan = plans.find((item) => item.code === event.code);
          return plan?.name === event.name && plan.attendees === event._count.attendees;
        });

      if (alreadyApplied) {
        const [invitations, checkIns] = await Promise.all([
          tx.invitation.count({ where: { status: { in: ["ENVIADA", "CONFIRMADA"] } } }),
          tx.checkIn.count(),
        ]);
        if (invitations !== 3384 || checkIns !== 3291) {
          throw new Error("La carga DEMO existe, pero sus totales cambiaron. Revisar manualmente.");
        }
        console.log("La carga DEMO ya existe con los totales esperados; no se realizaron cambios.");
        return;
      }

      const [attendeeCount, invitationCount, checkInCount, incidentCount] = await Promise.all([
        tx.attendee.count(), tx.invitation.count(), tx.checkIn.count(), tx.incident.count(),
      ]);
      const expectedOriginal = events.length === originalEvents.size &&
        events.every((event) => {
          const original = originalEvents.get(event.code);
          return original?.name === event.name && original.attendees === event._count.attendees;
        }) &&
        attendeeCount === 15 && invitationCount === 13 && checkInCount === 5 && incidentCount === 3;
      if (!expectedOriginal) {
        throw new Error("La base contiene datos distintos a los cuatro ejemplos originales. No se reemplazó nada.");
      }

      await tx.event.deleteMany({ where: { id: { in: events.map((event) => event.id) } } });
      await tx.event.createMany({ data: plans.map((plan) => ({
        code: plan.code,
        name: plan.name,
        eventDate: plan.date,
        type: "GRATUITO",
        capacity: plan.attendees + 20,
      })) });

      const createdEvents = await tx.event.findMany({
        where: { code: { in: plans.map((plan) => plan.code) } },
        select: { id: true, code: true },
      });
      if (createdEvents.length !== plans.length) throw new Error("No se crearon todos los eventos DEMO.");
      const eventIds = new Map(createdEvents.map((event) => [event.code, event.id]));

      const attendees = plans.flatMap((plan) => {
        const eventId = eventIds.get(plan.code);
        if (!eventId) throw new Error(`Falta el evento ${plan.code}.`);
        return Array.from({ length: plan.attendees }, (_, index) => {
          const number = String(index + 1).padStart(3, "0");
          const key = `${plan.code}-${number}`;
          return {
            eventId,
            firstName: "Invitado",
            lastName: `Demostración ${plan.code.slice(-3)}-${number}`,
            documentId: key,
            email: `${key.toLowerCase()}@example.invalid`,
            createdAt: new Date(plan.date.getTime() - 14 * 86_400_000),
          };
        });
      });
      for (const batch of chunk(attendees)) await tx.attendee.createMany({ data: batch });

      const createdAttendees = await tx.attendee.findMany({
        where: { eventId: { in: createdEvents.map((event) => event.id) } },
        select: { id: true, documentId: true },
      });
      if (createdAttendees.length !== 3948) throw new Error("No se crearon todos los asistentes DEMO.");
      const attendeeIds = new Map(createdAttendees.map((attendee) => [attendee.documentId, attendee.id]));

      const invitations = plans.flatMap((plan) =>
        Array.from({ length: plan.sentInvitations }, (_, index) => {
          const key = `${plan.code}-${String(index + 1).padStart(3, "0")}`;
          const attendeeId = attendeeIds.get(key);
          if (!attendeeId) throw new Error(`Falta el asistente ${key}.`);
          return {
            attendeeId,
            code: `INV-${key}`,
            status: index < plan.checkIns ? "CONFIRMADA" as const : "ENVIADA" as const,
            sentAt: new Date(plan.date.getTime() - 7 * 86_400_000),
          };
        })
      );
      for (const batch of chunk(invitations)) await tx.invitation.createMany({ data: batch });

      const createdInvitations = await tx.invitation.findMany({
        where: { code: { startsWith: "INV-DEMO-E" } },
        select: { id: true, code: true, status: true, sentAt: true },
      });
      if (createdInvitations.length !== 3384) throw new Error("No se crearon todas las invitaciones DEMO.");
      const histories = createdInvitations.flatMap((invitation) => [
        { invitationId: invitation.id, status: "ENVIADA" as const, changedAt: invitation.sentAt! },
        ...(invitation.status === "CONFIRMADA" ? [{ invitationId: invitation.id, status: "CONFIRMADA" as const, changedAt: invitation.sentAt! }] : []),
      ]);
      for (const batch of chunk(histories)) await tx.invitationStatusHistory.createMany({ data: batch });

      const checkIns = plans.flatMap((plan) =>
        Array.from({ length: plan.checkIns }, (_, index) => {
          const key = `${plan.code}-${String(index + 1).padStart(3, "0")}`;
          const attendeeId = attendeeIds.get(key);
          if (!attendeeId) throw new Error(`Falta el asistente ${key}.`);
          return { attendeeId, checkedInAt: new Date(plan.date.getTime() + (index % 120) * 60_000) };
        })
      );
      for (const batch of chunk(checkIns)) await tx.checkIn.createMany({ data: batch });
      console.log("Carga DEMO aplicada: 50 eventos, 3948 asistentes, 3384 invitaciones y 3291 ingresos.");
    }, { timeout: 180_000, maxWait: 10_000 });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Falló la carga de demostración.", error);
  process.exitCode = 1;
});
