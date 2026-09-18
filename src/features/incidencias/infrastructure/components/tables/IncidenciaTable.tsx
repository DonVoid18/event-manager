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
import { Plus } from "lucide-react"
import { Incidencia } from "@/features/incidencias/domain/Incidencia"
import { INCIDENT_CATEGORY_LABELS } from "@/features/incidencias/domain/validations/createIncidencia"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface IncidenciaTableProps {
  data: Incidencia[]
  onOpenAddDialog?: () => void
}

export function IncidenciaTable({ data, onOpenAddDialog }: IncidenciaTableProps) {
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Incidencias</h2>
          <p className="text-sm text-muted-foreground">{data.length} incidencia(s) registrada(s)</p>
        </div>
        <Button variant="default" size="sm" onClick={onOpenAddDialog}>
          <Plus className="mr-2 size-4" />
          Registrar incidencia
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Asistente</TableHead>
              <TableHead>Descripción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length ? (
              data.map((incidencia) => (
                <TableRow key={incidencia.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {format(new Date(incidencia.occurredAt), "dd MMM yyyy, HH:mm", { locale: es })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{INCIDENT_CATEGORY_LABELS[incidencia.category]}</Badge>
                  </TableCell>
                  <TableCell>
                    {incidencia.attendee
                      ? `${incidencia.attendee.firstName} ${incidencia.attendee.lastName}`
                      : "-"}
                  </TableCell>
                  <TableCell className="max-w-md text-sm">{incidencia.description}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No hay incidencias registradas.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default IncidenciaTable
