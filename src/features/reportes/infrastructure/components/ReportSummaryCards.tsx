import { ReportSummary } from "@/features/reportes/domain/ReportRow"
import { StatCard } from "@/shared/infrastructure/components/StatCard"
import { AlertTriangle, CalendarDays, CheckCircle2, MailCheck, ScanLine, Users } from "lucide-react"

const formatNumber = (value: number) => value.toLocaleString("es-PE")

export function ReportSummaryCards({ summary }: { summary: ReportSummary }) {
  const tasaInvitacion = summary.totalAsistentes ? summary.invitacionesEnviadas / summary.totalAsistentes : 0
  const tasaConfirmadas = summary.invitacionesEnviadas
    ? summary.invitacionesConfirmadas / summary.invitacionesEnviadas
    : 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard label="Eventos" value={formatNumber(summary.totalEventos)} icon={CalendarDays} tone="sky" />
      <StatCard label="Asistentes registrados" value={formatNumber(summary.totalAsistentes)} icon={Users} tone="violet" />
      <StatCard
        label="Invitaciones enviadas"
        value={formatNumber(summary.invitacionesEnviadas)}
        icon={MailCheck}
        tone="sky"
        progress={tasaInvitacion}
        hint={`${(tasaInvitacion * 100).toFixed(1)}% de los asistentes`}
      />
      <StatCard
        label="Invitaciones confirmadas"
        value={formatNumber(summary.invitacionesConfirmadas)}
        icon={CheckCircle2}
        tone="emerald"
        progress={tasaConfirmadas}
        hint={`${(tasaConfirmadas * 100).toFixed(1)}% de las enviadas`}
      />
      <StatCard
        label="Check-ins · tasa de asistencia"
        value={`${formatNumber(summary.totalCheckins)} · ${(summary.tasaConfirmacion * 100).toFixed(1)}%`}
        icon={ScanLine}
        tone="emerald"
        progress={summary.tasaConfirmacion}
      />
      <StatCard
        label="Incidencias registradas"
        value={formatNumber(summary.totalIncidencias)}
        icon={AlertTriangle}
        tone="amber"
        hint={summary.totalCheckins ? `${((summary.totalIncidencias / summary.totalCheckins) * 100).toFixed(1)}% de los ingresos` : undefined}
      />
    </div>
  )
}

export default ReportSummaryCards
