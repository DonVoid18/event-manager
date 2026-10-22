"use client"

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table"

import { Badge } from "@/shared/infrastructure/shadcn/components/ui/badge"
import { Button } from "@/shared/infrastructure/shadcn/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/infrastructure/shadcn/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/infrastructure/shadcn/components/ui/table"
import { ChevronLeft, ChevronRight, FileText, QrCode, Search, UserCheck, UserPlus } from "lucide-react"
import { Input } from "@/shared/infrastructure/shadcn/components/ui/input"
import { Asistente, AsistenteInvitacion } from "@/features/asistentes/domain/Asistente"
import { EventoType } from "@/features/eventos/domain/Evento"
import { InvitationDetailDialog } from "@/features/invitaciones/infrastructure/components/InvitationDetailDialog"
import { InvitationStatusSelect } from "@/features/invitaciones/infrastructure/components/InvitationStatusSelect"
import { SendInvitationButton } from "@/features/invitaciones/infrastructure/components/SendInvitationButton"
import { getPrivateFileUrl } from "@/shared/infrastructure/utils/privateFileUrl"
import { format } from "date-fns"
import { useMemo, useState } from "react"

interface AsistenteTableProps {
  data: Asistente[]
  eventType: EventoType
  onOpenAddDialog?: () => void
  onInvitationChange: (attendeeId: string, invitation: AsistenteInvitacion) => void
}

export function AsistenteTable({ data, eventType, onOpenAddDialog, onInvitationChange }: AsistenteTableProps) {
  const [search, setSearch] = useState("")
  const [invitationFilter, setInvitationFilter] = useState("TODOS")
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [detailId, setDetailId] = useState<string | null>(null)

  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase()
    return data.filter((a) => {
      const matchesSearch =
        term === "" ||
        `${a.firstName} ${a.lastName}`.toLowerCase().includes(term) ||
        a.documentId.toLowerCase().includes(term) ||
        a.email.toLowerCase().includes(term) ||
        (a.invitation?.code.toLowerCase().includes(term) ?? false)
      const status = a.invitation?.status ?? "SIN"
      const matchesStatus = invitationFilter === "TODOS" || status === invitationFilter
      return matchesSearch && matchesStatus
    })
  }, [data, search, invitationFilter])

  const columns = useMemo<ColumnDef<Asistente>[]>(() => {
    const base: ColumnDef<Asistente>[] = [
      {
        id: "nombre",
        header: "Asistente",
        cell: ({ row }) => (
          <div className="flex min-w-[220px] items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              {row.original.firstName[0]}
              {row.original.lastName[0]}
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold">
                {row.original.firstName} {row.original.lastName}
              </div>
              <div className="truncate text-xs text-muted-foreground">{row.original.email}</div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "documentId",
        header: "Documento",
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.documentId}</span>,
      },
      {
        id: "checkin",
        header: "Ingreso",
        cell: ({ row }) =>
          row.original.checkIn ? (
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
              <UserCheck className="mr-1 size-3.5" />
              {format(new Date(row.original.checkIn.checkedInAt), "HH:mm")}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">Sin ingreso</Badge>
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
              <Button
                variant="outline"
                size="icon"
                className="size-9"
                title="Ver QR e historial"
                onClick={() => setDetailId(attendee.id)}
              >
                <QrCode className="size-4" />
              </Button>
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
            <span className="text-sm font-medium tabular-nums">
              {row.original.paymentAmount ? `S/ ${row.original.paymentAmount.toFixed(2)}` : "-"}
            </span>
            {row.original.paymentReceiptKey && (
              <a
                href={getPrivateFileUrl(row.original.paymentReceiptKey)}
                target="_blank"
                rel="noreferrer"
                title="Ver comprobante"
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
    getPaginationRowModel: getPaginationRowModel(),
  })

  const detail = detailId ? data.find((a) => a.id === detailId) : null

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, documento, correo o código..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              table.setPageIndex(0)
            }}
            className="h-11 pl-9 text-base"
          />
        </div>
        <Select value={invitationFilter} onValueChange={(v) => { setInvitationFilter(v); table.setPageIndex(0) }}>
          <SelectTrigger className="h-11 w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todas las invitaciones</SelectItem>
            <SelectItem value="SIN">Sin invitación</SelectItem>
            <SelectItem value="PENDIENTE">Pendientes</SelectItem>
            <SelectItem value="ENVIADA">Enviadas</SelectItem>
            <SelectItem value="CONFIRMADA">Confirmadas</SelectItem>
          </SelectContent>
        </Select>
        <Button size="lg" className="h-11" onClick={onOpenAddDialog}>
          <UserPlus className="size-4" />
          Registrar asistente
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader className="bg-muted/70">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-12 px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                    <TableCell key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  No hay asistentes que coincidan con la búsqueda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} asistente(s) · Página {table.getState().pagination.pageIndex + 1} de{" "}
          {Math.max(table.getPageCount(), 1)}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="size-9" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="icon" className="size-9" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight />
          </Button>
        </div>
      </div>

      {detail?.invitation && (
        <InvitationDetailDialog
          open
          onOpenChange={(open) => !open && setDetailId(null)}
          attendeeName={`${detail.firstName} ${detail.lastName}`}
          invitation={detail.invitation}
        />
      )}
    </div>
  )
}

export default AsistenteTable
