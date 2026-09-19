"use client"

import { Asistente, AsistenteInvitacion } from "@/features/asistentes/domain/Asistente"
import { CreateAsistenteDialog } from "@/features/asistentes/infrastructure/components/dialogs/CreateAsistenteDialog"
import { AsistenteTable } from "@/features/asistentes/infrastructure/components/tables/AsistenteTable"
import { Evento } from "@/features/eventos/domain/Evento"
import { Incidencia } from "@/features/incidencias/domain/Incidencia"
import { CreateIncidenciaDialog } from "@/features/incidencias/infrastructure/components/dialogs/CreateIncidenciaDialog"
import { IncidenciaTable } from "@/features/incidencias/infrastructure/components/tables/IncidenciaTable"
import { Badge } from "@/shared/infrastructure/shadcn/components/ui/badge"
import { StatCard } from "@/shared/infrastructure/shadcn/components/stat-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/infrastructure/shadcn/components/ui/tabs"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDays, ScanLine, Ticket, Users } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

interface EventoDetailPageProps {
  evento: Evento
  asistentes: Asistente[]
  incidencias: Incidencia[]
}

export function EventoDetailPage({ evento, asistentes: initialAsistentes, incidencias: initialIncidencias }: EventoDetailPageProps) {
  const [asistentes, setAsistentes] = useState<Asistente[]>(initialAsistentes)
  const [incidencias, setIncidencias] = useState<Incidencia[]>(initialIncidencias)
  const [addAsistenteOpen, setAddAsistenteOpen] = useState(false)
  const [addIncidenciaOpen, setAddIncidenciaOpen] = useState(false)

  const handleAddAsistente = (nuevo: Asistente) => {
    setAsistentes((prev) => [nuevo, ...prev])
  }

  const handleInvitationChange = (attendeeId: string, invitation: AsistenteInvitacion) => {
    setAsistentes((prev) =>
      prev.map((a) => (a.id === attendeeId ? { ...a, invitation } : a))
    )
  }

  const handleAddIncidencia = (nueva: Incidencia) => {
    setIncidencias((prev) => [nueva, ...prev])
  }

  const confirmadas = asistentes.filter((a) => a.checkIn).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{evento.name}</h1>
            <Badge variant={evento.type === "PAGO" ? "default" : "secondary"}>
              {evento.type === "PAGO" ? "De pago" : "Gratuito"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground font-mono">{evento.code}</p>
        </div>
        <Link href="/checkin" className="text-sm text-primary underline-offset-4 hover:underline">
          Ir a check-in de este evento
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Fecha"
          value={format(new Date(evento.eventDate), "dd MMM yyyy, HH:mm", { locale: es })}
          icon={<CalendarDays className="size-5" />}
          color="info"
        />
        <StatCard
          label="Aforo"
          value={`${asistentes.length} / ${evento.capacity}`}
          icon={<Users className="size-5" />}
          color="primary"
        />
        <StatCard
          label="Check-ins"
          value={confirmadas}
          icon={<ScanLine className="size-5" />}
          color="success"
        />
        <StatCard
          label="Incidencias"
          value={incidencias.length}
          icon={<Ticket className="size-5" />}
          color="warning"
        />
      </div>

      <Tabs defaultValue="asistentes">
        <TabsList>
          <TabsTrigger value="asistentes">Asistentes</TabsTrigger>
          <TabsTrigger value="incidencias">Incidencias</TabsTrigger>
        </TabsList>
        <TabsContent value="asistentes">
          <AsistenteTable
            data={asistentes}
            eventType={evento.type}
            onOpenAddDialog={() => setAddAsistenteOpen(true)}
            onInvitationChange={handleInvitationChange}
          />
        </TabsContent>
        <TabsContent value="incidencias">
          <IncidenciaTable data={incidencias} onOpenAddDialog={() => setAddIncidenciaOpen(true)} />
        </TabsContent>
      </Tabs>

      {addAsistenteOpen && (
        <CreateAsistenteDialog
          open
          onOpenChange={setAddAsistenteOpen}
          eventId={evento.id}
          eventType={evento.type}
          handleAddAsistente={handleAddAsistente}
        />
      )}

      {addIncidenciaOpen && (
        <CreateIncidenciaDialog
          open
          onOpenChange={setAddIncidenciaOpen}
          eventId={evento.id}
          attendees={asistentes.map((a) => ({ id: a.id, firstName: a.firstName, lastName: a.lastName }))}
          handleAddIncidencia={handleAddIncidencia}
        />
      )}
    </div>
  )
}

export default EventoDetailPage
