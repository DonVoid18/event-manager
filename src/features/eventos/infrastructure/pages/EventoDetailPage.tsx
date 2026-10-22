"use client"

import { Asistente, AsistenteInvitacion } from "@/features/asistentes/domain/Asistente"
import { CreateAsistenteDialog } from "@/features/asistentes/infrastructure/components/dialogs/CreateAsistenteDialog"
import { AsistenteTable } from "@/features/asistentes/infrastructure/components/tables/AsistenteTable"
import { Evento } from "@/features/eventos/domain/Evento"
import { EVENT_STATUS_LABELS, getEventStatus } from "@/features/eventos/domain/eventStatus"
import { Incidencia } from "@/features/incidencias/domain/Incidencia"
import { CreateIncidenciaDialog } from "@/features/incidencias/infrastructure/components/dialogs/CreateIncidenciaDialog"
import { IncidenciaTable } from "@/features/incidencias/infrastructure/components/tables/IncidenciaTable"
import { StatCard } from "@/shared/infrastructure/components/StatCard"
import { Badge } from "@/shared/infrastructure/shadcn/components/ui/badge"
import { Button } from "@/shared/infrastructure/shadcn/components/ui/button"
import { Card, CardContent } from "@/shared/infrastructure/shadcn/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/infrastructure/shadcn/components/ui/tabs"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { AlertTriangle, ArrowLeft, CalendarDays, MailCheck, ScanLine, UserPlus, Users } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

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

  // Mantiene el historial local de estados para mostrarlo sin recargar la página.
  const handleInvitationChange = (attendeeId: string, invitation: AsistenteInvitacion) => {
    setAsistentes((prev) =>
      prev.map((a) => {
        if (a.id !== attendeeId) return a
        const previousHistory = a.invitation?.history ?? []
        const statusChanged = a.invitation?.status !== invitation.status || !a.invitation
        const history = statusChanged
          ? [...previousHistory, { status: invitation.status, changedAt: new Date() }]
          : previousHistory
        return { ...a, invitation: { ...invitation, history } }
      })
    )
  }

  const handleAddIncidencia = (nueva: Incidencia) => {
    setIncidencias((prev) => [nueva, ...prev])
  }

  const checkins = asistentes.filter((a) => a.checkIn).length
  const enviadas = asistentes.filter((a) => a.invitation && a.invitation.status !== "PENDIENTE").length
  const estado = getEventStatus(evento.eventDate)

  return (
    <div className="space-y-6">
      <Card className="gap-0 overflow-hidden p-0 shadow-sm">
        <div className="bg-gradient-to-r from-[#0d5360] to-[#102b3a] p-6 text-white md:p-8">
          <Link href="/eventos" className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white">
            <ArrowLeft className="size-4" /> Volver a eventos
          </Link>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-white/15 text-white hover:bg-white/15">
                  {evento.type === "PAGO" ? "Evento de pago" : "Evento gratuito"}
                </Badge>
                <Badge className="bg-white/15 text-white hover:bg-white/15">{EVENT_STATUS_LABELS[estado]}</Badge>
                <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs">{evento.code}</span>
              </div>
              <h1 className="text-2xl font-bold md:text-3xl">{evento.name}</h1>
              <p className="flex items-center gap-2 text-white/75">
                <CalendarDays className="size-4" />
                <span>{capitalize(format(new Date(evento.eventDate), "EEEE d 'de' MMMM 'de' yyyy, HH:mm 'h'", { locale: es }))}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="h-12 bg-white px-5 text-base text-teal-900 hover:bg-white/90" onClick={() => setAddAsistenteOpen(true)}>
                <UserPlus className="size-5" />
                Registrar asistente
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-white/30 bg-white/10 px-5 text-base text-white hover:bg-white/20 hover:text-white"
              >
                <Link href={`/checkin?evento=${evento.id}`}>
                  <ScanLine className="size-5" />
                  Abrir check-in
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Aforo ocupado"
          value={`${asistentes.length} / ${evento.capacity}`}
          icon={Users}
          tone="sky"
          progress={evento.capacity ? asistentes.length / evento.capacity : 0}
        />
        <StatCard
          label="Invitaciones enviadas"
          value={enviadas}
          icon={MailCheck}
          tone="violet"
          progress={asistentes.length ? enviadas / asistentes.length : 0}
        />
        <StatCard
          label="Check-ins realizados"
          value={checkins}
          icon={ScanLine}
          tone="emerald"
          progress={asistentes.length ? checkins / asistentes.length : 0}
        />
        <StatCard label="Incidencias" value={incidencias.length} icon={AlertTriangle} tone="amber" />
      </div>

      <Card className="shadow-sm">
        <CardContent>
          <Tabs defaultValue="asistentes" className="gap-5">
            <TabsList className="h-11">
              <TabsTrigger value="asistentes" className="px-5 text-sm">
                Asistentes e invitaciones
                <Badge variant="secondary" className="ml-2">{asistentes.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="incidencias" className="px-5 text-sm">
                Incidencias
                <Badge variant="secondary" className="ml-2">{incidencias.length}</Badge>
              </TabsTrigger>
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
        </CardContent>
      </Card>

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
