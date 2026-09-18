import { CheckinConsole } from "@/features/checkin/infrastructure/components/CheckinConsole"
import { prisma } from "@/shared/infrastructure/libs/prisma"

export const revalidate = 0

const page = async () => {
  const eventos = await prisma.event.findMany({
    orderBy: { eventDate: "desc" },
    select: { id: true, code: true, name: true },
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Check-in de asistentes</h1>
        <p className="text-sm text-muted-foreground">
          Busca al asistente por nombre, documento o código de invitación y registra su ingreso.
        </p>
      </div>
      <CheckinConsole eventos={eventos} />
    </div>
  )
}

export default page
