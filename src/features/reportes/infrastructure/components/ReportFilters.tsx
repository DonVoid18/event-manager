"use client"

import { Button } from "@/shared/infrastructure/shadcn/components/ui/button"
import { Input } from "@/shared/infrastructure/shadcn/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/infrastructure/shadcn/components/ui/select"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"

interface EventoOption {
  id: string
  code: string
  name: string
}

interface ReportFiltersProps {
  eventos: EventoOption[]
}

export function ReportFilters({ eventos }: ReportFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [eventId, setEventId] = useState(searchParams.get("eventId") ?? "TODOS")
  const [from, setFrom] = useState(searchParams.get("from") ?? "")
  const [to, setTo] = useState(searchParams.get("to") ?? "")
  const [tipo, setTipo] = useState(searchParams.get("tipo") ?? "REGISTRO")
  const [tipoEvento, setTipoEvento] = useState(searchParams.get("tipoEvento") ?? "TODOS")

  const applyFilters = (next: { eventId?: string; from?: string; to?: string; tipo?: string; tipoEvento?: string }) => {
    const params = new URLSearchParams(searchParams.toString())
    const values = { eventId, from, to, tipo, tipoEvento, ...next }
    if (!values.tipoEvento || values.tipoEvento === "TODOS") {
      params.delete("tipoEvento")
    } else {
      params.set("tipoEvento", values.tipoEvento)
    }

    if (!values.eventId || values.eventId === "TODOS") {
      params.delete("eventId")
    } else {
      params.set("eventId", values.eventId)
    }
    if (values.from) {
      params.set("from", values.from)
    } else {
      params.delete("from")
    }
    if (values.to) {
      params.set("to", values.to)
    } else {
      params.delete("to")
    }
    if (values.tipo && values.tipo !== "REGISTRO") {
      params.set("tipo", values.tipo)
    } else {
      params.delete("tipo")
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1.3fr_auto]">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Evento</label>
        <Select
          value={eventId}
          onValueChange={(value) => {
            setEventId(value)
            applyFilters({ eventId: value })
          }}
        >
          <SelectTrigger className="h-11 w-full">
            <SelectValue placeholder="Todos los eventos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos los eventos</SelectItem>
            {eventos.map((evento) => (
              <SelectItem key={evento.id} value={evento.id}>
                {evento.name} ({evento.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Desde</label>
        <Input
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value)
            applyFilters({ from: e.target.value })
          }}
          className="h-11 w-full"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Hasta</label>
        <Input
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value)
            applyFilters({ to: e.target.value })
          }}
          className="h-11 w-full"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Tipo de evento</label>
        <Select
          value={tipoEvento}
          onValueChange={(value) => {
            setTipoEvento(value)
            applyFilters({ tipoEvento: value })
          }}
        >
          <SelectTrigger className="h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos</SelectItem>
            <SelectItem value="GRATUITO">Gratuitos</SelectItem>
            <SelectItem value="PAGO">De pago</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Tipo de reporte</label>
        <Select
          value={tipo}
          onValueChange={(value) => {
            setTipo(value)
            applyFilters({ tipo: value })
          }}
        >
          <SelectTrigger className="h-11 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="REGISTRO">Registro de asistentes</SelectItem>
            <SelectItem value="INVITACIONES">Invitaciones</SelectItem>
            <SelectItem value="CHECKIN">Check-in</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(eventId !== "TODOS" || from || to || tipo !== "REGISTRO" || tipoEvento !== "TODOS") && (
        <Button
          variant="ghost"
          className="h-11"
          onClick={() => {
            setEventId("TODOS")
            setFrom("")
            setTo("")
            setTipo("REGISTRO")
            setTipoEvento("TODOS")
            router.push(pathname)
          }}
        >
          Limpiar filtros
        </Button>
      )}
    </div>
  )
}

export default ReportFilters
