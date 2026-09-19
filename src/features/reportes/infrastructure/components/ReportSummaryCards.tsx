import { StatCard } from "@/shared/infrastructure/shadcn/components/stat-card"
import { ReportSummary } from "@/features/reportes/domain/ReportRow"
import { CalendarDays, Percent, ScanLine, Users } from "lucide-react"

export function ReportSummaryCards({ summary }: { summary: ReportSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Eventos" value={summary.totalEventos} icon={<CalendarDays className="size-5" />} color="primary" />
      <StatCard
        label="Asistentes registrados"
        value={summary.totalAsistentes}
        icon={<Users className="size-5" />}
        color="info"
      />
      <StatCard
        label="Check-ins realizados"
        value={summary.totalCheckins}
        icon={<ScanLine className="size-5" />}
        color="success"
      />
      <StatCard
        label="Tasa de asistencia"
        value={`${(summary.tasaConfirmacion * 100).toFixed(1)}%`}
        icon={<Percent className="size-5" />}
        color="warning"
      />
    </div>
  )
}

export default ReportSummaryCards
