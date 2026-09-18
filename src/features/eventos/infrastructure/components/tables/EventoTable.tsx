"use client"

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
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
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  MoreVertical,
  Plus,
  Search,
} from "lucide-react"
import { Input } from "@/shared/infrastructure/shadcn/components/ui/input"
import { EventoConMetricas } from "@/features/eventos/domain/Evento"
import { createContext, useContext, useMemo, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface TableCallbacks {
  onEdit: (evento: EventoConMetricas) => void
}

const getEstado = (eventDate: Date) => {
  const now = new Date()
  const eventDay = new Date(eventDate)
  const endOfEventDay = new Date(eventDay)
  endOfEventDay.setHours(23, 59, 59, 999)
  return endOfEventDay < now ? "finalizado" : "proximo"
}

const columns: ColumnDef<EventoConMetricas>[] = [
  {
    accessorKey: "code",
    header: "Código",
    size: 100,
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{row.original.code}</span>
    ),
  },
  {
    accessorKey: "name",
    header: "Evento",
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    accessorKey: "eventDate",
    header: "Fecha",
    cell: ({ row }) => (
      <span>{format(new Date(row.original.eventDate), "dd MMM yyyy, HH:mm", { locale: es })}</span>
    ),
  },
  {
    accessorKey: "type",
    header: "Tipo",
    size: 100,
    cell: ({ row }) => (
      <Badge variant={row.original.type === "PAGO" ? "default" : "secondary"}>
        {row.original.type === "PAGO" ? "De pago" : "Gratuito"}
      </Badge>
    ),
  },
  {
    id: "estado",
    header: "Estado",
    size: 100,
    cell: ({ row }) => {
      const estado = getEstado(row.original.eventDate)
      return (
        <Badge variant={estado === "proximo" ? "outline" : "secondary"}>
          {estado === "proximo" ? "Próximo" : "Finalizado"}
        </Badge>
      )
    },
  },
  {
    id: "aforo",
    header: "Aforo",
    size: 110,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.registeredCount} / {row.original.capacity}
      </span>
    ),
  },
  {
    id: "actions",
    size: 50,
    cell: ({ row }) => <ActionsCell row={row} />,
  },
]

const TableCallbacksContext = createContext<TableCallbacks>({
  onEdit: () => { },
})

function ActionsCell({ row }: { row: Row<EventoConMetricas> }) {
  const { onEdit } = useContext(TableCallbacksContext)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex size-8 text-muted-foreground data-[state=open]:bg-muted"
          size="icon"
        >
          <MoreVertical />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild>
          <Link href={`/eventos/${row.original.id}`}>
            <Eye className="mr-2 size-4" />
            Ver detalle
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(row.original)}>
          <Edit className="mr-2 size-4" />
          Editar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SimpleRow({ row }: { row: Row<EventoConMetricas> }) {
  return (
    <TableRow>
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

interface EventoTableProps {
  data: EventoConMetricas[]
  onEdit: (evento: EventoConMetricas) => void
  onOpenAddDialog?: () => void
}

export function EventoTable({ data, onEdit, onOpenAddDialog }: EventoTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "eventDate", desc: true }])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("TODOS")
  const [estadoFilter, setEstadoFilter] = useState<string>("TODOS")

  const filteredData = useMemo(() => {
    return data.filter((evento) => {
      const matchesSearch =
        search.trim() === "" ||
        evento.name.toLowerCase().includes(search.toLowerCase()) ||
        evento.code.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === "TODOS" || evento.type === typeFilter
      const matchesEstado = estadoFilter === "TODOS" || getEstado(evento.eventDate) === estadoFilter
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
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <TableCallbacksContext.Provider value={{ onEdit }}>
      <div className="w-full flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Historial de eventos</h1>
            <p className="text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} evento(s)
            </p>
          </div>
          <Button variant="default" onClick={onOpenAddDialog}>
            <Plus className="mr-2 size-4" />
            Nuevo evento
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los tipos</SelectItem>
              <SelectItem value="GRATUITO">Gratuito</SelectItem>
              <SelectItem value="PAGO">De pago</SelectItem>
            </SelectContent>
          </Select>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los estados</SelectItem>
              <SelectItem value="proximo">Próximos</SelectItem>
              <SelectItem value="finalizado">Finalizados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative flex flex-col gap-4 overflow-auto">
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={header.column.getCanSort() ? "cursor-pointer select-none" : undefined}
                        onClick={header.column.getToggleSortingHandler()}
                      >
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
                  table.getRowModel().rows.map((row) => <SimpleRow key={row.id} row={row} />)
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No hay eventos que coincidan con los filtros.
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
      </div>
    </TableCallbacksContext.Provider>
  )
}

export default EventoTable
