"use client"

import { EventoConMetricas } from "@/features/eventos/domain/Evento"
import { getEventStatus } from "@/features/eventos/domain/eventStatus"
import { PageHeader } from "@/shared/infrastructure/components/PageHeader"
import { StatCard } from "@/shared/infrastructure/components/StatCard"
import { Button } from "@/shared/infrastructure/shadcn/components/ui/button"
import { Card, CardContent } from "@/shared/infrastructure/shadcn/components/ui/card"
import { CalendarCheck, CalendarClock, CalendarDays, CalendarPlus, Gauge, Send, UserPlus } from "lucide-react"
import { useMemo, useState } from "react"
import { CreateEventoDialog } from "../components/dialogs/CreateEventoDialog"
import { UpdateEventoDialog } from "../components/dialogs/UpdateEventoDialog"
import { EventoTable } from "../components/tables/EventoTable"

interface EventoPageProps {
  eventos: EventoConMetricas[]
  openCreate?: boolean
}

type DialogState =
  | { type: "create" }
  | { type: "update"; evento: EventoConMetricas }
  | null

const STEPS = [
  { icon: CalendarPlus, title: "1. Crea el evento", text: "Nombre, fecha, tipo (gratuito o de pago) y aforo máximo." },
  { icon: UserPlus, title: "2. Registra asistentes", text: "Con validación de datos, duplicados y comprobante de pago." },
  { icon: Send, title: "3. Envía invitaciones", text: "Por correo, con código QR para el check-in." },
]

export function EventoPage({ eventos: initialEventos, openCreate = false }: EventoPageProps) {
  const [dialog, setDialog] = useState<DialogState>(openCreate ? { type: "create" } : null)
  const [eventos, setEventos] = useState<EventoConMetricas[]>(initialEventos)

  const stats = useMemo(() => {
    const proximos = eventos.filter((e) => getEventStatus(e.eventDate) !== "FINALIZADO").length
    const finalizados = eventos.length - proximos
    const capacidad = eventos.reduce((acc, e) => acc + e.capacity, 0)
    const registrados = eventos.reduce((acc, e) => acc + e.registeredCount, 0)
    return { proximos, finalizados, ocupacion: capacidad ? registrados / capacidad : 0 }
  }, [eventos])

  const handleAddEvento = (nuevo: Omit<EventoConMetricas, "registeredCount" | "checkedInCount">) => {
    setEventos((prev) => [{ ...nuevo, registeredCount: 0, checkedInCount: 0 }, ...prev])
  }

  const handleUpdateEvento = (actualizado: Omit<EventoConMetricas, "registeredCount" | "checkedInCount">) => {
    setEventos((prev) => prev.map((item) => (item.id === actualizado.id ? { ...item, ...actualizado } : item)))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gestión de eventos"
        title="Eventos"
        description="Crea eventos, registra asistentes y gestiona sus invitaciones desde un solo lugar."
        actions={
          <Button size="lg" className="h-12 px-6 text-base" onClick={() => setDialog({ type: "create" })}>
            <CalendarPlus className="size-5" />
            Nuevo evento
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Eventos registrados" value={eventos.length} icon={CalendarDays} tone="sky" />
        <StatCard label="Próximos y en curso" value={stats.proximos} icon={CalendarClock} tone="amber" />
        <StatCard label="Finalizados" value={stats.finalizados} icon={CalendarCheck} tone="slate" />
        <StatCard
          label="Ocupación promedio"
          value={`${(stats.ocupacion * 100).toFixed(1)}%`}
          icon={Gauge}
          tone="emerald"
          progress={stats.ocupacion}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {STEPS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-start gap-4 rounded-xl border border-dashed bg-card p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Icon className="size-5" />
            </div>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          </div>
        ))}
      </div>

      <Card className="shadow-sm">
        <CardContent>
          <EventoTable data={eventos} onEdit={(evento) => setDialog({ type: "update", evento })} />
        </CardContent>
      </Card>

      {dialog?.type === "create" && (
        <CreateEventoDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          handleAddEvento={handleAddEvento}
        />
      )}
      {dialog?.type === "update" && (
        <UpdateEventoDialog
          open
          onOpenChange={(open) => !open && setDialog(null)}
          evento={dialog.evento}
          handleUpdateEvento={handleUpdateEvento}
        />
      )}
    </div>
  )
}

export default EventoPage
