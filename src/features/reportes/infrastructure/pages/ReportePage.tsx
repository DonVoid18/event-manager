import { AttendanceChart } from "@/features/dashboard/infrastructure/components/AttendanceChart"
import { ReportEventSummary, ReportRow, ReportSummary, ReportTipo } from "@/features/reportes/domain/ReportRow"
import { PageHeader } from "@/shared/infrastructure/components/PageHeader"
import { Button } from "@/shared/infrastructure/shadcn/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/infrastructure/shadcn/components/ui/card"
import { FileSpreadsheet, Printer } from "lucide-react"
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
  byEvent: ReportEventSummary[]
  tipo: ReportTipo
  printUrl: string
  excelUrl: string
}

export function ReportePage({ eventos, rows, summary, byEvent, tipo, printUrl, excelUrl }: ReportePageProps) {
  const chartData = byEvent
    .slice(0, 12)
    .map((e) => ({
      code: e.eventCode.replace("EVT-", ""),
      name: e.eventName,
      registrados: e.registrados,
      asistentes: e.asistentes,
    }))
    .reverse()

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Análisis"
        title="Reportes"
        description="Consulta el registro, las invitaciones y los check-in de tus eventos, y exporta los resultados."
        actions={
          <>
            <Button asChild size="lg" className="h-12 bg-emerald-600 px-5 text-base hover:bg-emerald-700">
              <a href={excelUrl}>
                <FileSpreadsheet className="size-5" />
                Exportar Excel
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-5 text-base">
              <a href={printUrl} target="_blank" rel="noreferrer">
                <Printer className="size-5" />
                Exportar PDF
              </a>
            </Button>
          </>
        }
      />

      <Card className="shadow-sm">
        <CardContent>
          <Suspense fallback={null}>
            <ReportFilters eventos={eventos} />
          </Suspense>
        </CardContent>
      </Card>

      <ReportSummaryCards summary={summary} />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Registrados vs. asistentes por evento</CardTitle>
          <CardDescription>
            {chartData.length ? `Los ${chartData.length} eventos más recientes del filtro aplicado` : "Sin datos para el filtro"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length ? (
            <AttendanceChart data={chartData} height={280} />
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">No hay eventos con los filtros seleccionados.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardContent>
          <ReportTable rows={rows} tipo={tipo} />
        </CardContent>
      </Card>
    </div>
  )
}

export default ReportePage
