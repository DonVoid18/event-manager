import { CheckinConsole } from "@/features/checkin/infrastructure/components/CheckinConsole"
import { PageHeader } from "@/shared/infrastructure/components/PageHeader"
import { prisma } from "@/shared/infrastructure/libs/prisma"

export const revalidate = 0

interface PageProps {
  searchParams: Promise<{ evento?: string }>
}

const page = async ({ searchParams }: PageProps) => {
  const { evento } = await searchParams
  const eventos = await prisma.event.findMany({
    orderBy: { eventDate: "desc" },
    select: { id: true, code: true, name: true, eventDate: true },
  })

  // Por defecto se propone el evento de hoy o el próximo; si no hay, el más reciente.
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const upcoming = [...eventos].filter((e) => e.eventDate >= startOfToday).sort((a, b) => +a.eventDate - +b.eventDate)
  const defaultEventId = eventos.some((e) => e.id === evento) ? evento : upcoming[0]?.id ?? eventos[0]?.id

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Día del evento"
        title="Check-in de asistentes"
        description="Registra el ingreso buscando por nombre, documento o código, o leyendo el QR de la invitación."
      />
      <CheckinConsole eventos={eventos} initialEventId={defaultEventId} />
    </div>
  )
}

export default page
