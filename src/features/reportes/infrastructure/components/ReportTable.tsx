"use client"

import { Badge } from "@/shared/infrastructure/shadcn/components/ui/badge"
import { Button } from "@/shared/infrastructure/shadcn/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/infrastructure/shadcn/components/ui/table"
import { ReportRow, ReportTipo } from "@/features/reportes/domain/ReportRow"
import { exportReportToCsv } from "@/features/reportes/infrastructure/utils/exportCsv"
import { InvitationStatusBadge } from "@/features/invitaciones/infrastructure/components/InvitationStatusBadge"
import { ChevronLeft, ChevronRight, FileDown } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useMemo, useState } from "react"

const TIPO_TITLES: Record<ReportTipo, string> = {
  REGISTRO: "Detalle del registro de asistentes",
  INVITACIONES: "Detalle de invitaciones",
  CHECKIN: "Detalle de ingresos (check-in)",
}

const PAGE_SIZE = 15

interface ReportTableProps {
  rows: ReportRow[]
  tipo: ReportTipo
}

export function ReportTable({ rows, tipo }: ReportTableProps) {
  const displayRows = useMemo(() => (tipo === "CHECKIN" ? rows.filter((r) => r.checkedInAt) : rows), [rows, tipo])
  const [page, setPage] = useState(0)
  const pageCount = Math.max(Math.ceil(displayRows.length / PAGE_SIZE), 1)
  const current = Math.min(page, pageCount - 1)
  const visible = displayRows.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{TIPO_TITLES[tipo]}</h2>
          <p className="text-sm text-muted-foreground">{displayRows.length.toLocaleString("es-PE")} registro(s)</p>
        </div>
        <Button variant="outline" onClick={() => exportReportToCsv(rows, tipo)}>
          <FileDown className="size-4" />
          Descargar CSV
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader className="bg-muted/70">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-12 px-4 text-xs font-semibold uppercase tracking-wide">Evento</TableHead>
              <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide">Asistente</TableHead>
              <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide">Documento</TableHead>
              {tipo === "REGISTRO" && <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide">Fecha de registro</TableHead>}
              {tipo === "INVITACIONES" && <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide">Estado</TableHead>}
              {tipo === "INVITACIONES" && <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide">Enviada</TableHead>}
              {tipo === "CHECKIN" && <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide">Ingreso</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length ? (
              visible.map((row) => (
                <TableRow key={row.attendeeId}>
                  <TableCell className="px-4 py-3">
                    <div className="font-medium">{row.eventName}</div>
                    <div className="font-mono text-xs text-muted-foreground">{row.eventCode}</div>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="font-medium">{row.firstName} {row.lastName}</div>
                    <div className="text-xs text-muted-foreground">{row.email}</div>
                  </TableCell>
                  <TableCell className="px-4 font-mono text-sm">{row.documentId}</TableCell>
                  {tipo === "REGISTRO" && (
                    <TableCell className="px-4 text-sm">
                      {format(new Date(row.registeredAt), "dd MMM yyyy, HH:mm", { locale: es })}
                    </TableCell>
                  )}
                  {tipo === "INVITACIONES" && (
                    <TableCell className="px-4">
                      <InvitationStatusBadge status={row.invitationStatus} />
                    </TableCell>
                  )}
                  {tipo === "INVITACIONES" && (
                    <TableCell className="px-4 text-sm text-muted-foreground">
                      {row.invitationSentAt ? format(new Date(row.invitationSentAt), "dd MMM yyyy, HH:mm", { locale: es }) : "—"}
                    </TableCell>
                  )}
                  {tipo === "CHECKIN" && (
                    <TableCell className="px-4">
                      {row.checkedInAt ? (
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                          {format(new Date(row.checkedInAt), "dd MMM yyyy, HH:mm", { locale: es })}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  No hay datos para los filtros seleccionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Página {current + 1} de {pageCount}</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="size-9" onClick={() => setPage(current - 1)} disabled={current === 0}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" className="size-9" onClick={() => setPage(current + 1)} disabled={current >= pageCount - 1}>
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ReportTable
