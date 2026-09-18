"use client"

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"

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
import { ChevronLeft, ChevronRight, FileText, Plus, Search, UserCheck } from "lucide-react"
import { Input } from "@/shared/infrastructure/shadcn/components/ui/input"
import { Asistente, AsistenteInvitacion } from "@/features/asistentes/domain/Asistente"
import { EventoType } from "@/features/eventos/domain/Evento"
import { InvitationStatusSelect } from "@/features/invitaciones/infrastructure/components/InvitationStatusSelect"
import { SendInvitationButton } from "@/features/invitaciones/infrastructure/components/SendInvitationButton"
import { getPrivateFileUrl } from "@/shared/infrastructure/utils/privateFileUrl"
import { useMemo, useState } from "react"

interface AsistenteTableProps {
  data: Asistente[]
  eventType: EventoType
  onOpenAddDialog?: () => void
  onInvitationChange: (attendeeId: string, invitation: AsistenteInvitacion) => void
}

export function AsistenteTable({ data, eventType, onOpenAddDialog, onInvitationChange }: AsistenteTableProps) {
  const [search, setSearch] = useState("")
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const filteredData = useMemo(() => {
    if (search.trim() === "") return data
    const term = search.toLowerCase()
    return data.filter(
      (a) =>
        `${a.firstName} ${a.lastName}`.toLowerCase().includes(term) ||
        a.documentId.toLowerCase().includes(term) ||
        a.email.toLowerCase().includes(term)
    )
  }, [data, search])

  const columns = useMemo<ColumnDef<Asistente>[]>(() => {
    const base: ColumnDef<Asistente>[] = [
      {
        id: "nombre",
        header: "Asistente",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">
              {row.original.firstName} {row.original.lastName}
            </div>
            <div className="text-xs text-muted-foreground">{row.original.email}</div>
          </div>
        ),
      },
      {
        accessorKey: "documentId",
        header: "Documento",
        size: 120,
      },
      {
        id: "checkin",
        header: "Check-in",
        size: 110,
        cell: ({ row }) =>
          row.original.checkIn ? (
            <Badge variant="success">
              <UserCheck className="mr-1 size-3" />
              Ingresó
            </Badge>
          ) : (
            <Badge variant="outline">Sin ingreso</Badge>
          ),
      },
      {
        id: "invitacion",
        header: "Invitación",
        cell: ({ row }) => {
          const attendee = row.original
          if (!attendee.invitation) {
            return (
              <SendInvitationButton
                attendeeId={attendee.id}
                onSent={(invitation) => onInvitationChange(attendee.id, invitation)}
              />
            )
          }
          return (
            <div className="flex items-center gap-2">
              <InvitationStatusSelect
                invitationId={attendee.invitation.id}
                status={attendee.invitation.status}
                onStatusChange={(status) =>
                  onInvitationChange(attendee.id, { ...attendee.invitation!, status })
                }
              />
              {attendee.invitation.status === "PENDIENTE" && (
                <SendInvitationButton
                  attendeeId={attendee.id}
                  onSent={(invitation) => onInvitationChange(attendee.id, invitation)}
                />
              )}
            </div>
          )
        },
      },
    ]

    if (eventType === "PAGO") {
      base.push({
        id: "pago",
        header: "Pago",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {row.original.paymentAmount ? `S/ ${row.original.paymentAmount.toFixed(2)}` : "-"}
            </span>
            {row.original.paymentReceiptKey && (
              <a
                href={getPrivateFileUrl(row.original.paymentReceiptKey)}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground"
              >
                <FileText className="size-4" />
              </a>
            )}
          </div>
        ),
      })
    }

    return base
  }, [eventType, onInvitationChange])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { pagination },
    getRowId: (row) => row.id,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Asistentes</h2>
          <p className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} asistente(s)
          </p>
        </div>
        <Button variant="default" size="sm" onClick={onOpenAddDialog}>
          <Plus className="mr-2 size-4" />
          Registrar asistente
        </Button>
      </div>

      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, documento o correo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No hay asistentes registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-4">
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          Página {table.getState().pagination.pageIndex + 1} de {Math.max(table.getPageCount(), 1)}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AsistenteTable
