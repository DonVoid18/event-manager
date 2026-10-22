"use client"

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type SortingState,
} from "@tanstack/react-table"

import { Badge } from "@/shared/infrastructure/shadcn/components/ui/badge"
import { Button } from "@/shared/infrastructure/shadcn/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/infrastructure/shadcn/components/ui/dropdown-menu"
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
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Edit,
  MoreVertical,
  ScanLine,
  Search,
} from "lucide-react"
import { Input } from "@/shared/infrastructure/shadcn/components/ui/input"
import { EventoConMetricas } from "@/features/eventos/domain/Evento"
import { EVENT_STATUS_LABELS, getEventStatus, type EventStatus } from "@/features/eventos/domain/eventStatus"
import { ProgressBar } from "@/shared/infrastructure/components/StatCard"
import { createContext, useContext, useMemo, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface TableCallbacks {
  onEdit: (evento: EventoConMetricas) => void
}

const STATUS_STYLES: Record<EventStatus, string> = {
  PROXIMO: "border-sky-200 bg-sky-50 text-sky-700",
  HOY: "border-amber-200 bg-amber-50 text-amber-700",
  FINALIZADO: "border-slate-200 bg-slate-100 text-slate-600",
}

const STATUS_ORDER: Record<EventStatus, number> = { HOY: 0, PROXIMO: 1, FINALIZADO: 2 }

function SortHeader({ label, column }: { label: string; column: import("@tanstack/react-table").Column<EventoConMetricas> }) {
  const sorted = column.getIsSorted()
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 font-semibold"
      onClick={column.getToggleSortingHandler()}
    >
      {label}
      {sorted === "asc" && <ArrowUp className="size-3.5" />}
      {sorted === "desc" && <ArrowDown className="size-3.5" />}
    </button>
  )
}

const columns: ColumnDef<EventoConMetricas>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortHeader label="Evento" column={column} />,
    cell: ({ row }) => (
      <div className="min-w-[260px] space-y-1">
        <Link href={`/eventos/${row.original.id}`} className="font-semibold hover:text-primary">
          {row.original.name}
        </Link>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono">{row.original.code}</span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "eventDate",
    header: ({ column }) => <SortHeader label="Fecha" column={column} />,
    sortingFn: (a, b) => new Date(a.original.eventDate).getTime() - new Date(b.original.eventDate).getTime(),
    cell: ({ row }) => (
      <div className="flex items-center gap-2 whitespace-nowrap text-sm">
        <CalendarDays className="size-4 text-muted-foreground" />
        <div>
          <div className="font-medium">{format(new Date(row.original.eventDate), "dd MMM yyyy", { locale: es })}</div>
          <div className="text-xs text-muted-foreground">{format(new Date(row.original.eventDate), "HH:mm 'h'")}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: ({ column }) => <SortHeader label="Tipo" column={column} />,
    cell: ({ row }) => (
      <Badge variant={row.original.type === "PAGO" ? "default" : "secondary"}>
        {row.original.type === "PAGO" ? "De pago" : "Gratuito"}
      </Badge>
    ),
  },
  {
    id: "estado",
    accessorFn: (row) => STATUS_ORDER[getEventStatus(row.eventDate)],
    header: ({ column }) => <SortHeader label="Estado" column={column} />,
    cell: ({ row }) => {
      const estado = getEventStatus(row.original.eventDate)
      return (
        <Badge variant="outline" className={STATUS_STYLES[estado]}>
          {EVENT_STATUS_LABELS[estado]}
        </Badge>
      )
    },
  },
  {
    id: "aforo",
    header: "Aforo",
    cell: ({ row }) => {
      const { registeredCount, capacity } = row.original
      return (
        <div className="w-36 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="font-medium tabular-nums">{registeredCount} / {capacity}</span>
            <span className="text-muted-foreground">{capacity ? Math.round((registeredCount / capacity) * 100) : 0}%</span>
          </div>
          <ProgressBar value={capacity ? registeredCount / capacity : 0} />
        </div>
      )
    },
  },
  {
    id: "asistencia",
    header: "Asistencia",
    cell: ({ row }) => {
      const { registeredCount, checkedInCount } = row.original
      const estado = getEventStatus(row.original.eventDate)
      if (estado === "PROXIMO") return <span className="text-xs text-muted-foreground">Aún no inicia</span>
      return (
        <div className="w-32 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="font-medium tabular-nums">{checkedInCount} ingresos</span>
          </div>
          <ProgressBar value={registeredCount ? checkedInCount / registeredCount : 0} tone="emerald" />
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionsCell row={row} />,
  },
]

const TableCallbacksContext = createContext<TableCallbacks>({
  onEdit: () => { },
})

function ActionsCell({ row }: { row: Row<EventoConMetricas> }) {
  const { onEdit } = useContext(TableCallbacksContext)
  return (
    <div className="flex items-center justify-end gap-1">
      <Button asChild variant="outline" size="sm" className="h-9">
        <Link href={`/eventos/${row.original.id}`}>
          Gestionar
          <ArrowRight className="size-4" />
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-9 text-muted-foreground">
            <MoreVertical />
            <span className="sr-only">Más opciones</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onEdit(row.original)}>
            <Edit className="mr-2 size-4" />
            Editar evento
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/checkin?evento=${row.original.id}`}>
              <ScanLine className="mr-2 size-4" />
              Abrir check-in
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

interface EventoTableProps {
  data: EventoConMetricas[]
  onEdit: (evento: EventoConMetricas) => void
}

export function EventoTable({ data, onEdit }: EventoTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "eventDate", desc: true }])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("TODOS")
  const [estadoFilter, setEstadoFilter] = useState<string>("TODOS")

  const filteredData = useMemo(() => {
    const term = search.trim().toLowerCase()
    return data.filter((evento) => {
      const matchesSearch =
        term === "" || evento.name.toLowerCase().includes(term) || evento.code.toLowerCase().includes(term)
      const matchesType = typeFilter === "TODOS" || evento.type === typeFilter
      const matchesEstado = estadoFilter === "TODOS" || getEventStatus(evento.eventDate) === estadoFilter
      return matchesSearch && matchesType && matchesEstado
    })
  }, [data, search, typeFilter, estadoFilter])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, pagination },
    getRowId: (row) => row.id,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const total = table.getFilteredRowModel().rows.length

  return (
    <TableCallbacksContext.Provider value={{ onEdit }}>
      <div className="flex w-full flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o código del evento..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                table.setPageIndex(0)
              }}
              className="h-11 pl-9 text-base"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); table.setPageIndex(0) }}>
            <SelectTrigger className="h-11 w-44">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los tipos</SelectItem>
              <SelectItem value="GRATUITO">Gratuito</SelectItem>
              <SelectItem value="PAGO">De pago</SelectItem>
            </SelectContent>
          </Select>
          <Select value={estadoFilter} onValueChange={(v) => { setEstadoFilter(v); table.setPageIndex(0) }}>
            <SelectTrigger className="h-11 w-44">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los estados</SelectItem>
              <SelectItem value="HOY">Hoy</SelectItem>
              <SelectItem value="PROXIMO">Próximos</SelectItem>
              <SelectItem value="FINALIZADO">Finalizados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader className="bg-muted/70">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="h-12 px-4 text-xs uppercase tracking-wide text-muted-foreground">
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
                      <TableCell key={cell.id} className="px-4 py-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                    No hay eventos que coincidan con los filtros.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {total} evento(s) · Página {table.getState().pagination.pageIndex + 1} de {Math.max(table.getPageCount(), 1)}
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
      </div>
    </TableCallbacksContext.Provider>
  )
}

export default EventoTable
