import { randomBytes } from "node:crypto";
import type { PrismaClient } from "@prisma/client";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(prefix: string, length = 6) {
  const segment = Array.from(randomBytes(length), (value) => CODE_ALPHABET[value % CODE_ALPHABET.length]).join("");
  return `${prefix}-${segment}`;
}

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(10, 0, 0, 0);
  return date;
}

type InvitationPlan = "SIN_INVITACION" | "PENDIENTE" | "ENVIADA" | "CONFIRMADA";

interface AttendeePlan {
  firstName: string;
  lastName: string;
  documentId: string;
  email: string;
  phone: string;
  paymentAmount?: number;
  paymentReference?: string;
  invitation: InvitationPlan;
  checkedIn: boolean;
}

interface EventPlan {
  name: string;
  eventDate: Date;
  type: "GRATUITO" | "PAGO";
  capacity: number;
  attendees: AttendeePlan[];
  incidents: { description: string; category: "ACCESO" | "DOCUMENTACION" | "PAGO" | "TECNICA" | "OTRO"; attendeeIndex?: number }[];
}

const eventPlans: EventPlan[] = [
  {
    name: "Conferencia Anual TUMITECH 2026",
    eventDate: daysFromNow(20),
    type: "GRATUITO",
    capacity: 150,
    attendees: [
      { firstName: "Lucía", lastName: "Fernández", documentId: "70011223", email: "lucia.fernandez@example.com", phone: "987001122", invitation: "CONFIRMADA", checkedIn: false },
      { firstName: "Renzo", lastName: "Salazar", documentId: "70011224", email: "renzo.salazar@example.com", phone: "987001123", invitation: "ENVIADA", checkedIn: false },
      { firstName: "Camila", lastName: "Vargas", documentId: "70011225", email: "camila.vargas@example.com", phone: "987001124", invitation: "PENDIENTE", checkedIn: false },
      { firstName: "Diego", lastName: "Huamán", documentId: "70011226", email: "diego.huaman@example.com", phone: "987001125", invitation: "SIN_INVITACION", checkedIn: false },
    ],
    incidents: [],
  },
  {
    name: "Workshop de Ciberseguridad Empresarial",
    eventDate: daysFromNow(10),
    type: "PAGO",
    capacity: 40,
    attendees: [
      { firstName: "Andrea", lastName: "Chávez", documentId: "70022331", email: "andrea.chavez@example.com", phone: "987002233", paymentAmount: 180, paymentReference: "OP-559812", invitation: "ENVIADA", checkedIn: false },
      { firstName: "Bruno", lastName: "Ríos", documentId: "70022332", email: "bruno.rios@example.com", phone: "987002234", paymentAmount: 180, paymentReference: "OP-559844", invitation: "PENDIENTE", checkedIn: false },
      { firstName: "Fiorella", lastName: "Paredes", documentId: "70022333", email: "fiorella.paredes@example.com", phone: "987002235", paymentAmount: 180, paymentReference: "OP-559877", invitation: "ENVIADA", checkedIn: false },
    ],
    incidents: [],
  },
  {
    name: "Meetup de Desarrolladores TUMITECH",
    eventDate: daysFromNow(-12),
    type: "GRATUITO",
    capacity: 60,
    attendees: [
      { firstName: "Jorge", lastName: "Mendoza", documentId: "70033441", email: "jorge.mendoza@example.com", phone: "987003344", invitation: "CONFIRMADA", checkedIn: true },
      { firstName: "Valeria", lastName: "Quispe", documentId: "70033442", email: "valeria.quispe@example.com", phone: "987003345", invitation: "CONFIRMADA", checkedIn: true },
      { firstName: "Sebastián", lastName: "Rojas", documentId: "70033443", email: "sebastian.rojas@example.com", phone: "987003346", invitation: "CONFIRMADA", checkedIn: true },
      { firstName: "Milagros", lastName: "Castro", documentId: "70033444", email: "milagros.castro@example.com", phone: "987003347", invitation: "ENVIADA", checkedIn: false },
      { firstName: "Gonzalo", lastName: "Flores", documentId: "70033445", email: "gonzalo.flores@example.com", phone: "987003348", invitation: "SIN_INVITACION", checkedIn: false },
    ],
    incidents: [
      { description: "El lector de códigos QR dejó de funcionar durante 15 minutos al inicio del registro.", category: "TECNICA" },
      { description: "Un asistente llegó sin documento de identidad físico, solo con foto en el celular.", category: "DOCUMENTACION", attendeeIndex: 3 },
    ],
  },
  {
    name: "Curso Avanzado de Cloud Computing",
    eventDate: daysFromNow(-5),
    type: "PAGO",
    capacity: 30,
    attendees: [
      { firstName: "Patricia", lastName: "Núñez", documentId: "70044551", email: "patricia.nunez@example.com", phone: "987004455", paymentAmount: 250, paymentReference: "OP-778901", invitation: "CONFIRMADA", checkedIn: true },
      { firstName: "Álvaro", lastName: "Ortega", documentId: "70044552", email: "alvaro.ortega@example.com", phone: "987004456", paymentAmount: 250, paymentReference: "OP-778922", invitation: "CONFIRMADA", checkedIn: true },
      { firstName: "Ximena", lastName: "Delgado", documentId: "70044553", email: "ximena.delgado@example.com", phone: "987004457", paymentAmount: 250, paymentReference: "OP-778933", invitation: "ENVIADA", checkedIn: false },
    ],
    incidents: [
      { description: "El comprobante de pago registrado no coincidía con el monto del curso; se solicitó corrección.", category: "PAGO", attendeeIndex: 2 },
    ],
  },
];

export async function seedDemoEventData(prisma: PrismaClient) {
  await prisma.$transaction(async (tx) => {
    const existingEvents = await tx.event.count();
    if (existingEvents > 0) {
      console.log("Ya existen eventos registrados; se omite la carga de datos de ejemplo.");
      return;
    }

    for (const plan of eventPlans) {
      const event = await tx.event.create({
        data: {
          code: randomCode("EVT"),
          name: plan.name,
          eventDate: plan.eventDate,
          type: plan.type,
          capacity: plan.capacity,
        },
      });

      const createdAttendees = [];

      for (const attendeePlan of plan.attendees) {
        const attendee = await tx.attendee.create({
          data: {
            eventId: event.id,
            firstName: attendeePlan.firstName,
            lastName: attendeePlan.lastName,
            documentId: attendeePlan.documentId,
            email: attendeePlan.email,
            phone: attendeePlan.phone,
            paymentAmount: attendeePlan.paymentAmount ?? null,
            paymentReference: attendeePlan.paymentReference ?? null,
          },
        });
        createdAttendees.push(attendee);

        if (attendeePlan.invitation !== "SIN_INVITACION") {
          const invitation = await tx.invitation.create({
            data: {
              attendeeId: attendee.id,
              code: randomCode("INV", 8),
              status: attendeePlan.invitation,
              sentAt: attendeePlan.invitation !== "PENDIENTE" ? new Date() : null,
            },
          });

          if (attendeePlan.invitation === "ENVIADA" || attendeePlan.invitation === "CONFIRMADA") {
            await tx.invitationStatusHistory.create({
              data: { invitationId: invitation.id, status: "ENVIADA" },
            });
          }
          if (attendeePlan.invitation === "CONFIRMADA") {
            await tx.invitationStatusHistory.create({
              data: { invitationId: invitation.id, status: "CONFIRMADA" },
            });
          }
        }

        if (attendeePlan.checkedIn) {
          await tx.checkIn.create({ data: { attendeeId: attendee.id } });
        }
      }

      for (const incidentPlan of plan.incidents) {
        await tx.incident.create({
          data: {
            eventId: event.id,
            attendeeId:
              incidentPlan.attendeeIndex !== undefined
                ? createdAttendees[incidentPlan.attendeeIndex]?.id ?? null
                : null,
            description: incidentPlan.description,
            category: incidentPlan.category,
          },
        });
      }

      console.log(`Evento de ejemplo creado: ${event.name} (${event.code})`);
    }
  }, { timeout: 30_000 });
}
