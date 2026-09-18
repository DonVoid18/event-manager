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
import { ReportRow } from "@/features/reportes/domain/ReportRow"
import { exportReportToCsv } from "@/features/reportes/infrastructure/utils/exportCsv"
import { InvitationStatusBadge } from "@/features/invitaciones/infrastructure/components/InvitationStatusBadge"
import { FileDown, Printer } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ReportTableProps {
  rows: ReportRow[]
  tipo: "REGISTRO" | "INVITACIONES" | "CHECKIN"
  printUrl: string
}

export function ReportTable({ rows, tipo, printUrl }: ReportTableProps) {
  const displayRows = tipo === "CHECKIN" ? rows.filter((r) => r.checkedInAt) : rows

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{displayRows.length} registro(s)</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportReportToCsv(rows, tipo)}>
            <FileDown className="mr-2 size-4" />
            Exportar Excel (CSV)
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={printUrl} target="_blank" rel="noreferrer">
              <Printer className="mr-2 size-4" />
              Exportar PDF
            </a>
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Evento</TableHead>
              <TableHead>Asistente</TableHead>
              <TableHead>Documento</TableHead>
              {tipo === "REGISTRO" && <TableHead>Fecha de registro</TableHead>}
              {tipo === "INVITACIONES" && <TableHead>Estado de invitación</TableHead>}
              {tipo === "CHECKIN" && <TableHead>Ingreso</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.length ? (
              displayRows.map((row) => (
                <TableRow key={row.attendeeId}>
                  <TableCell>
                    <div className="font-medium">{row.eventName}</div>
                    <div className="font-mono text-xs text-muted-foreground">{row.eventCode}</div>
                  </TableCell>
                  <TableCell>
                    <div>{row.firstName} {row.lastName}</div>
                    <div className="text-xs text-muted-foreground">{row.email}</div>
                  </TableCell>
                  <TableCell>{row.documentId}</TableCell>
                  {tipo === "REGISTRO" && (
                    <TableCell>
                      {format(new Date(row.registeredAt), "dd MMM yyyy, HH:mm", { locale: es })}
                    </TableCell>
                  )}
                  {tipo === "INVITACIONES" && (
                    <TableCell>
                      <InvitationStatusBadge status={row.invitationStatus} />
                    </TableCell>
                  )}
                  {tipo === "CHECKIN" && (
                    <TableCell>
                      {row.checkedInAt ? (
                        <Badge variant="default">
                          {format(new Date(row.checkedInAt), "dd MMM yyyy, HH:mm", { locale: es })}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No hay datos para los filtros seleccionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default ReportTable
