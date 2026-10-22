import EventoDetailPage from "@/features/eventos/infrastructure/pages/EventoDetailPage"
import { prisma } from "@/shared/infrastructure/libs/prisma"
import { notFound } from "next/navigation"

export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

const page = async ({ params }: PageProps) => {
  const { id } = await params

  const evento = await prisma.event.findUnique({
    where: { id },
    include: {
      attendees: {
        orderBy: { createdAt: "desc" },
        include: {
          invitation: { include: { history: { orderBy: { changedAt: "asc" } } } },
          checkIn: true,
        },
      },
      incidents: {
        orderBy: { occurredAt: "desc" },
        include: { attendee: { select: { firstName: true, lastName: true } } },
      },
    },
  })

  if (!evento) {
    notFound()
  }

  return (
    <EventoDetailPage
      evento={{
        id: evento.id,
        code: evento.code,
        name: evento.name,
        eventDate: evento.eventDate,
        type: evento.type,
        capacity: evento.capacity,
      }}
      asistentes={evento.attendees.map((a) => ({
        id: a.id,
        eventId: a.eventId,
        firstName: a.firstName,
        lastName: a.lastName,
        documentId: a.documentId,
        email: a.email,
        phone: a.phone,
        paymentAmount: a.paymentAmount,
        paymentReference: a.paymentReference,
        paymentReceiptKey: a.paymentReceiptKey,
        createdAt: a.createdAt,
        invitation: a.invitation
          ? {
            id: a.invitation.id,
            code: a.invitation.code,
            status: a.invitation.status,
            sentAt: a.invitation.sentAt,
            history: a.invitation.history.map((h) => ({ status: h.status, changedAt: h.changedAt })),
          }
          : null,
        checkIn: a.checkIn ? { id: a.checkIn.id, checkedInAt: a.checkIn.checkedInAt } : null,
      }))}
      incidencias={evento.incidents.map((i) => ({
        id: i.id,
        eventId: i.eventId,
        attendeeId: i.attendeeId,
        description: i.description,
        category: i.category,
        occurredAt: i.occurredAt,
        attendee: i.attendee,
      }))}
    />
  )
}

export default page
