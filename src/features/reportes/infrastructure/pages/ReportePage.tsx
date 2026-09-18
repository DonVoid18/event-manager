import { ReportRow, ReportSummary } from "@/features/reportes/domain/ReportRow"
import { Suspense } from "react"
import { ReportFilters } from "../components/ReportFilters"
import { ReportSummaryCards } from "../components/ReportSummaryCards"
import { ReportTable } from "../components/ReportTable"

interface EventoOption {
  id: string
  code: string
  name: string
}

interface ReportePageProps {
  eventos: EventoOption[]
  rows: ReportRow[]
  summary: ReportSummary
  tipo: "REGISTRO" | "INVITACIONES" | "CHECKIN"
  printUrl: string
}

export function ReportePage({ eventos, rows, summary, tipo, printUrl }: ReportePageProps) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Consulta el registro, las invitaciones y los check-in de tus eventos.
        </p>
      </div>

      <Suspense fallback={null}>
        <ReportFilters eventos={eventos} />
      </Suspense>
      <ReportSummaryCards summary={summary} />
      <ReportTable rows={rows} tipo={tipo} printUrl={printUrl} />
    </div>
  )
}

export default ReportePage
