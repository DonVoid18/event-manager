"use client"

import { Asistente, AsistenteInvitacion } from "@/features/asistentes/domain/Asistente"
import { CreateAsistenteDialog } from "@/features/asistentes/infrastructure/components/dialogs/CreateAsistenteDialog"
import { AsistenteTable } from "@/features/asistentes/infrastructure/components/tables/AsistenteTable"
import { Evento } from "@/features/eventos/domain/Evento"
import { Incidencia } from "@/features/incidencias/domain/Incidencia"
import { CreateIncidenciaDialog } from "@/features/incidencias/infrastructure/components/dialogs/CreateIncidenciaDialog"
import { IncidenciaTable } from "@/features/incidencias/infrastructure/components/tables/IncidenciaTable"
import { Badge } from "@/shared/infrastructure/shadcn/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/infrastructure/shadcn/components/ui/card"
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fecha</CardTitle>
            <CalendarDays className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-lg font-semibold">
            {format(new Date(evento.eventDate), "dd MMM yyyy, HH:mm", { locale: es })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aforo</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-lg font-semibold">
            {asistentes.length} / {evento.capacity}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Check-ins</CardTitle>
            <ScanLine className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-lg font-semibold">{confirmadas}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Incidencias</CardTitle>
            <Ticket className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-lg font-semibold">{incidencias.length}</CardContent>
        </Card>
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
