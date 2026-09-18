import { Card, CardContent, CardHeader, CardTitle } from "@/shared/infrastructure/shadcn/components/ui/card"
import { ReportSummary } from "@/features/reportes/domain/ReportRow"
import { CalendarDays, Percent, ScanLine, Users } from "lucide-react"

export function ReportSummaryCards({ summary }: { summary: ReportSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Eventos</CardTitle>
          <CalendarDays className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{summary.totalEventos}</CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Asistentes registrados</CardTitle>
          <Users className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{summary.totalAsistentes}</CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Check-ins realizados</CardTitle>
          <ScanLine className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="text-2xl font-semibold">{summary.totalCheckins}</CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Tasa de asistencia</CardTitle>
          <Percent className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="text-2xl font-semibold">
          {(summary.tasaConfirmacion * 100).toFixed(1)}%
        </CardContent>
      </Card>
    </div>
  )
}

export default ReportSummaryCards
