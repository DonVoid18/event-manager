import { ReportePage } from "@/features/reportes/infrastructure/pages/ReportePage"
import { getReportData } from "@/features/reportes/infrastructure/queries/getReportData"
import { prisma } from "@/shared/infrastructure/libs/prisma"

export const revalidate = 0

interface PageProps {
  searchParams: Promise<{ eventId?: string; from?: string; to?: string; tipo?: string }>
}

const VALID_TIPOS = ["REGISTRO", "INVITACIONES", "CHECKIN"] as const

const page = async ({ searchParams }: PageProps) => {
  const params = await searchParams
  const tipo = VALID_TIPOS.includes(params.tipo as never) ? (params.tipo as (typeof VALID_TIPOS)[number]) : "REGISTRO"

  const [eventos, { rows, summary }] = await Promise.all([
    prisma.event.findMany({
      orderBy: { eventDate: "desc" },
      select: { id: true, code: true, name: true },
    }),
    getReportData({ eventId: params.eventId, from: params.from, to: params.to }),
  ])

  const printParams = new URLSearchParams()
  if (params.eventId) printParams.set("eventId", params.eventId)
  if (params.from) printParams.set("from", params.from)
  if (params.to) printParams.set("to", params.to)
  printParams.set("tipo", tipo)

  return (
    <ReportePage
      eventos={eventos}
      rows={rows}
      summary={summary}
      tipo={tipo}
      printUrl={`/reportes-imprimir?${printParams.toString()}`}
    />
  )
}

export default page
