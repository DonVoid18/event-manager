import EventoPage from "@/features/eventos/infrastructure/pages/EventoPage"
import { prisma } from "@/shared/infrastructure/libs/prisma"

export const revalidate = 0

interface PageProps {
  searchParams: Promise<{ nuevo?: string }>
}

const page = async ({ searchParams }: PageProps) => {
  const { nuevo } = await searchParams
  const eventos = await prisma.event.findMany({
    orderBy: { eventDate: "desc" },
    include: {
      _count: {
        select: { attendees: true },
      },
      attendees: {
        select: { checkIn: { select: { id: true } } },
      },
    },
  })

  const initialEventos = eventos.map((evento) => ({
    id: evento.id,
    code: evento.code,
    name: evento.name,
    eventDate: evento.eventDate,
    type: evento.type,
    capacity: evento.capacity,
    registeredCount: evento._count.attendees,
    checkedInCount: evento.attendees.filter((a) => a.checkIn).length,
  }))

  return <EventoPage eventos={initialEventos} openCreate={nuevo === "1"} />
}

export default page
