import { ReportePage } from "@/features/reportes/infrastructure/pages/ReportePage"
import { getReportData } from "@/features/reportes/infrastructure/queries/getReportData"
import { parseReportParams } from "@/features/reportes/infrastructure/utils/parseReportParams"
import { prisma } from "@/shared/infrastructure/libs/prisma"

export const revalidate = 0

interface PageProps {
  searchParams: Promise<{ eventId?: string; from?: string; to?: string; tipo?: string; tipoEvento?: string }>
}

const page = async ({ searchParams }: PageProps) => {
  const { filters, tipo, query } = parseReportParams(await searchParams)

  const [eventos, { rows, summary, byEvent }] = await Promise.all([
    prisma.event.findMany({
      orderBy: { eventDate: "desc" },
      select: { id: true, code: true, name: true },
    }),
    getReportData(filters),
  ])

  return (
    <ReportePage
      eventos={eventos}
      rows={rows}
      summary={summary}
      byEvent={byEvent}
      tipo={tipo}
      printUrl={`/reportes-imprimir?${query}`}
      excelUrl={`/api/reportes/excel?${query}`}
    />
  )
}

export default page
