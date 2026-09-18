"use client"

import { Badge } from "@/shared/infrastructure/shadcn/components/ui/badge"
import { Button } from "@/shared/infrastructure/shadcn/components/ui/button"
import { Input } from "@/shared/infrastructure/shadcn/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/infrastructure/shadcn/components/ui/select"
import { CheckinAttendee } from "@/features/checkin/domain/CheckinResult"
import { searchAttendeesAction } from "@/features/checkin/infrastructure/actions/searchAttendeesAction"
import { registerCheckinAction } from "@/features/checkin/infrastructure/actions/registerCheckinAction"
import { CreateIncidenciaDialog } from "@/features/incidencias/infrastructure/components/dialogs/CreateIncidenciaDialog"
import { AlertTriangle, CheckCircle2, Search, UserCheck } from "lucide-react"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

interface EventoOption {
  id: string
  code: string
  name: string
}

interface CheckinConsoleProps {
  eventos: EventoOption[]
}

export function CheckinConsole({ eventos }: CheckinConsoleProps) {
  const [eventId, setEventId] = useState<string>(eventos[0]?.id ?? "")
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CheckinAttendee[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [incidentAttendeeId, setIncidentAttendeeId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (!eventId || query.trim().length < 2) {
      setResults([])
      return
    }

    setIsSearching(true)
    const timeout = setTimeout(async () => {
      const result = await searchAttendeesAction(eventId, query)
      if (result.success) {
        setResults(result.data as CheckinAttendee[])
      }
      setIsSearching(false)
    }, 300)

    return () => clearTimeout(timeout)
  }, [eventId, query])

  const handleCheckin = (attendeeId: string) => {
    setPendingId(attendeeId)
    startTransition(async () => {
      const result = await registerCheckinAction(attendeeId)
      setPendingId(null)
      if (result.success) {
        toast.success(result.message)
        setResults((prev) =>
          prev.map((a) => (a.id === attendeeId ? { ...a, checkedIn: true, checkedInAt: new Date() } : a))
        )
      } else {
        toast.error(result.message)
        if (result.duplicate) {
          setResults((prev) => prev.map((a) => (a.id === attendeeId ? { ...a, checkedIn: true } : a)))
        }
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={eventId} onValueChange={setEventId}>
          <SelectTrigger className="w-full max-w-sm">
            <SelectValue placeholder="Selecciona un evento" />
          </SelectTrigger>
          <SelectContent>
            {eventos.map((evento) => (
              <SelectItem key={evento.id} value={evento.id}>
                {evento.name} ({evento.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, documento o código de invitación..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
          disabled={!eventId}
        />
      </div>

      {isSearching && <p className="text-sm text-muted-foreground">Buscando...</p>}

      <div className="flex flex-col gap-2">
        {results.map((attendee) => (
          <div
            key={attendee.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
          >
            <div>
              <div className="font-medium">
                {attendee.firstName} {attendee.lastName}
              </div>
              <div className="text-xs text-muted-foreground">
                Doc. {attendee.documentId} · {attendee.email}
                {attendee.invitationCode ? ` · ${attendee.invitationCode}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {attendee.checkedIn ? (
                <Badge variant="default">
                  <CheckCircle2 className="mr-1 size-3" />
                  Ingreso registrado
                </Badge>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleCheckin(attendee.id)}
                  disabled={pendingId === attendee.id}
                >
                  <UserCheck className="mr-2 size-4" />
                  {pendingId === attendee.id ? "Registrando..." : "Registrar ingreso"}
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setIncidentAttendeeId(attendee.id)}>
                <AlertTriangle className="mr-2 size-4" />
                Incidencia
              </Button>
            </div>
          </div>
        ))}
        {!isSearching && query.trim().length >= 2 && results.length === 0 && (
          <p className="text-sm text-muted-foreground">No se encontraron asistentes con ese criterio.</p>
        )}
      </div>

      {incidentAttendeeId && eventId && (
        <CreateIncidenciaDialog
          open
          onOpenChange={(open) => !open && setIncidentAttendeeId(null)}
          eventId={eventId}
          attendees={results.map((r) => ({ id: r.id, firstName: r.firstName, lastName: r.lastName }))}
          defaultAttendeeId={incidentAttendeeId}
          handleAddIncidencia={() => setIncidentAttendeeId(null)}
        />
      )}
    </div>
  )
}

export default CheckinConsole
