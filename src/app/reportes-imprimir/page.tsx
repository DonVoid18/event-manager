import { auth } from "@/shared/infrastructure/libs/auth"
import { getReportData } from "@/features/reportes/infrastructure/queries/getReportData"
import { parseReportParams } from "@/features/reportes/infrastructure/utils/parseReportParams"
import { SIGN_IN_ROUTE } from "@/shared/infrastructure/utils/routes"
import { redirect } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export const revalidate = 0

interface PageProps {
  searchParams: Promise<{ eventId?: string; from?: string; to?: string; tipo?: string; tipoEvento?: string }>
}

const TIPO_LABELS: Record<string, string> = {
  REGISTRO: "Registro de asistentes",
  INVITACIONES: "Invitaciones",
  CHECKIN: "Check-in",
}

const INVITATION_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  ENVIADA: "Enviada",
  CONFIRMADA: "Confirmada",
}

const page = async ({ searchParams }: PageProps) => {
  const session = await auth()
  if (!session) {
    redirect(SIGN_IN_ROUTE)
  }

  const { filters, tipo } = parseReportParams(await searchParams)

  const { rows, summary } = await getReportData(filters)

  const displayRows = tipo === "CHECKIN" ? rows.filter((r) => r.checkedInAt) : rows

  return (
    <div className="mx-auto max-w-4xl p-8 text-sm text-foreground">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <p className="text-muted-foreground">Vista de impresión. Usa Ctrl/Cmd+P para guardar como PDF.</p>
      </div>

      <h1 className="text-xl font-bold">TUMITECH S.A.C. — {TIPO_LABELS[tipo]}</h1>
      <p className="mb-4 text-muted-foreground">
        Generado el {format(new Date(), "dd MMM yyyy, HH:mm", { locale: es })}
      </p>

      <div className="mb-6 grid grid-cols-4 gap-4 text-center">
        <div className="rounded border p-2">
          <div className="text-lg font-semibold">{summary.totalEventos}</div>
          <div className="text-xs text-muted-foreground">Eventos</div>
        </div>
        <div className="rounded border p-2">
          <div className="text-lg font-semibold">{summary.totalAsistentes}</div>
          <div className="text-xs text-muted-foreground">Asistentes</div>
        </div>
        <div className="rounded border p-2">
          <div className="text-lg font-semibold">{summary.totalCheckins}</div>
          <div className="text-xs text-muted-foreground">Check-ins</div>
        </div>
        <div className="rounded border p-2">
          <div className="text-lg font-semibold">{(summary.tasaConfirmacion * 100).toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground">Asistencia</div>
        </div>
      </div>

      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b">
            <th className="p-2">Evento</th>
            <th className="p-2">Asistente</th>
            <th className="p-2">Documento</th>
            {tipo === "REGISTRO" && <th className="p-2">Fecha de registro</th>}
            {tipo === "INVITACIONES" && <th className="p-2">Estado de invitación</th>}
            {tipo === "CHECKIN" && <th className="p-2">Ingreso</th>}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row) => (
            <tr key={row.attendeeId} className="border-b">
              <td className="p-2">{row.eventName} ({row.eventCode})</td>
              <td className="p-2">{row.firstName} {row.lastName}</td>
              <td className="p-2">{row.documentId}</td>
              {tipo === "REGISTRO" && (
                <td className="p-2">{format(new Date(row.registeredAt), "dd MMM yyyy, HH:mm", { locale: es })}</td>
              )}
              {tipo === "INVITACIONES" && (
                <td className="p-2">
                  {row.invitationStatus ? INVITATION_LABELS[row.invitationStatus] : "Sin invitación"}
                </td>
              )}
              {tipo === "CHECKIN" && (
                <td className="p-2">
                  {row.checkedInAt ? format(new Date(row.checkedInAt), "dd MMM yyyy, HH:mm", { locale: es }) : "-"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default page
