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

  const applyFilters = (next: { eventId?: string; from?: string; to?: string; tipo?: string }) => {
    const params = new URLSearchParams(searchParams.toString())
    const values = { eventId, from, to, tipo, ...next }

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
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Evento</label>
        <Select
          value={eventId}
          onValueChange={(value) => {
            setEventId(value)
            applyFilters({ eventId: value })
          }}
        >
          <SelectTrigger className="w-56">
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

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Desde</label>
        <Input
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value)
            applyFilters({ from: e.target.value })
          }}
          className="w-40"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Hasta</label>
        <Input
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value)
            applyFilters({ to: e.target.value })
          }}
          className="w-40"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">Tipo de reporte</label>
        <Select
          value={tipo}
          onValueChange={(value) => {
            setTipo(value)
            applyFilters({ tipo: value })
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="REGISTRO">Registro de asistentes</SelectItem>
            <SelectItem value="INVITACIONES">Invitaciones</SelectItem>
            <SelectItem value="CHECKIN">Check-in</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(eventId !== "TODOS" || from || to || tipo !== "REGISTRO") && (
        <Button
          variant="ghost"
          onClick={() => {
            setEventId("TODOS")
            setFrom("")
            setTo("")
            setTipo("REGISTRO")
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
