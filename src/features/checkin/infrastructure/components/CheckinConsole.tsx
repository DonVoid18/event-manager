"use client"

import { Badge } from "@/shared/infrastructure/shadcn/components/ui/badge"
import { Button } from "@/shared/infrastructure/shadcn/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/infrastructure/shadcn/components/ui/card"
import { Input } from "@/shared/infrastructure/shadcn/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/infrastructure/shadcn/components/ui/select"
import { CheckinAttendee } from "@/features/checkin/domain/CheckinResult"
import { getCheckinStatsAction, type CheckinStats } from "@/features/checkin/infrastructure/actions/getCheckinStatsAction"
import { searchAttendeesAction } from "@/features/checkin/infrastructure/actions/searchAttendeesAction"
import { registerCheckinAction } from "@/features/checkin/infrastructure/actions/registerCheckinAction"
import { QrScannerDialog } from "@/features/checkin/infrastructure/components/QrScannerDialog"
import { CreateIncidenciaDialog } from "@/features/incidencias/infrastructure/components/dialogs/CreateIncidenciaDialog"
import { ProgressBar } from "@/shared/infrastructure/components/StatCard"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { AlertTriangle, CheckCircle2, Clock, QrCode, Search, ShieldCheck, UserCheck } from "lucide-react"
import { useCallback, useEffect, useState, useTransition } from "react"
import { toast } from "sonner"

interface EventoOption {
  id: string
  code: string
  name: string
  eventDate: Date
}

interface CheckinConsoleProps {
  eventos: EventoOption[]
  initialEventId?: string
}

export function CheckinConsole({ eventos, initialEventId }: CheckinConsoleProps) {
  const [eventId, setEventId] = useState<string>(initialEventId ?? eventos[0]?.id ?? "")
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<CheckinAttendee[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [incidentAttendeeId, setIncidentAttendeeId] = useState<string | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [autoCode, setAutoCode] = useState<string | null>(null)
  const [stats, setStats] = useState<CheckinStats | null>(null)
  const [, startTransition] = useTransition()

  const selectedEvent = eventos.find((e) => e.id === eventId)

  const refreshStats = useCallback(async (id: string) => {
    if (!id) return
    const result = await getCheckinStatsAction(id)
    if (result.success) setStats(result.data)
  }, [])

  useEffect(() => {
    setStats(null)
    void refreshStats(eventId)
  }, [eventId, refreshStats])

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

  const handleCheckin = useCallback((attendeeId: string) => {
    setPendingId(attendeeId)
    startTransition(async () => {
      const result = await registerCheckinAction(attendeeId)
      setPendingId(null)
      if (result.success) {
        toast.success(result.message)
        setResults((prev) =>
          prev.map((a) => (a.id === attendeeId ? { ...a, checkedIn: true, checkedInAt: new Date() } : a))
        )
        void refreshStats(eventId)
      } else {
        toast.error(result.message)
        if (result.duplicate) {
          setResults((prev) => prev.map((a) => (a.id === attendeeId ? { ...a, checkedIn: true } : a)))
        }
      }
    })
  }, [eventId, refreshStats])

  // Tras leer un QR, registra el ingreso automáticamente si el código coincide con un único asistente.
  useEffect(() => {
    if (!autoCode || isSearching) return
    const match = results.find((r) => r.invitationCode?.toUpperCase() === autoCode.toUpperCase())
    if (match) {
      if (match.checkedIn) {
        toast.error(`Ya se registró el ingreso de ${match.firstName} ${match.lastName}. No se permiten ingresos duplicados.`)
      } else {
        handleCheckin(match.id)
      }
      setAutoCode(null)
    } else if (results.length === 0 && query === autoCode) {
      toast.error("El código leído no corresponde a una invitación de este evento.")
      setAutoCode(null)
    }
  }, [autoCode, results, isSearching, query, handleCheckin])

  const handleDetected = useCallback((value: string) => {
    setQuery(value)
    setAutoCode(value)
  }, [])

  const pendientes = stats ? stats.registered - stats.checkedIn : 0

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="space-y-6 xl:col-span-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Control de acceso</CardTitle>
            <CardDescription>Selecciona el evento y busca al asistente o escanea su código QR.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Evento</label>
              <Select value={eventId} onValueChange={(value) => { setEventId(value); setQuery(""); setResults([]) }}>
                <SelectTrigger className="h-12 w-full text-base">
                  <SelectValue placeholder="Selecciona un evento" />
                </SelectTrigger>
                <SelectContent>
                  {eventos.map((evento) => (
                    <SelectItem key={evento.id} value={evento.id}>
                      {evento.name} · {format(new Date(evento.eventDate), "dd/MM/yyyy")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Nombre, documento, correo o código de invitación..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-14 pl-12 text-lg"
                  disabled={!eventId}
                />
              </div>
              <Button size="lg" className="h-14 px-6 text-base" disabled={!eventId} onClick={() => setScannerOpen(true)}>
                <QrCode className="size-5" />
                Escanear QR
              </Button>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="size-4 text-emerald-600" />
              {isSearching
                ? "Buscando..."
                : "Listo para registrar ingresos. Los ingresos duplicados se bloquean automáticamente."}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {results.map((attendee) => (
            <Card key={attendee.id} className="gap-0 p-0 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-base font-semibold text-accent-foreground">
                    {attendee.firstName[0]}
                    {attendee.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold">
                      {attendee.firstName} {attendee.lastName}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      DNI {attendee.documentId} · {attendee.email}
                    </p>
                    {attendee.invitationCode && (
                      <span className="mt-1 inline-block rounded bg-muted px-2 py-0.5 font-mono text-xs">
                        {attendee.invitationCode}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {attendee.checkedIn ? (
                    <Badge variant="outline" className="h-11 border-emerald-200 bg-emerald-50 px-4 text-sm text-emerald-700">
                      <CheckCircle2 className="mr-1.5 size-4" />
                      Ingresó{attendee.checkedInAt ? ` · ${format(new Date(attendee.checkedInAt), "HH:mm")}` : ""}
                    </Badge>
                  ) : (
                    <Button
                      size="lg"
                      className="h-11 bg-emerald-600 px-5 text-base hover:bg-emerald-700"
                      onClick={() => handleCheckin(attendee.id)}
                      disabled={pendingId === attendee.id}
                    >
                      <UserCheck className="size-5" />
                      {pendingId === attendee.id ? "Registrando..." : "Registrar ingreso"}
                    </Button>
                  )}
                  <Button size="lg" variant="outline" className="h-11" onClick={() => setIncidentAttendeeId(attendee.id)}>
                    <AlertTriangle className="size-4" />
                    Incidencia
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {!isSearching && query.trim().length >= 2 && results.length === 0 && (
            <Card className="items-center p-10 text-center text-muted-foreground shadow-sm">
              No se encontraron asistentes con ese criterio en este evento.
            </Card>
          )}

          {query.trim().length < 2 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-card p-12 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <ScanIllustration />
              </div>
              <p className="text-lg font-semibold">Esperando al siguiente asistente</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Escribe al menos 2 caracteres para buscar, o usa “Escanear QR” para leer el código de la invitación.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Resumen del evento</CardTitle>
            <CardDescription className="line-clamp-2">{selectedEvent?.name ?? "Sin evento seleccionado"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Registrados" value={stats?.registered} />
              <Metric label="Ingresaron" value={stats?.checkedIn} className="text-emerald-600" />
              <Metric label="Pendientes" value={stats ? pendientes : undefined} className="text-sky-700" />
              <Metric label="Incidencias" value={stats?.incidents} className="text-amber-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Asistencia</span>
                <span className="font-semibold">
                  {stats && stats.registered ? ((stats.checkedIn / stats.registered) * 100).toFixed(1) : "0.0"}%
                </span>
              </div>
              <ProgressBar value={stats && stats.registered ? stats.checkedIn / stats.registered : 0} tone="emerald" className="h-3" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Últimos ingresos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats?.recent.length ? (
              stats.recent.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg border p-3">
                  <span className="truncate text-sm font-medium">{r.name}</span>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {format(new Date(r.checkedInAt), "dd MMM, HH:mm", { locale: es })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Aún no hay ingresos en este evento.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <QrScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onDetected={handleDetected} />

      {incidentAttendeeId && eventId && (
        <CreateIncidenciaDialog
          open
          onOpenChange={(open) => !open && setIncidentAttendeeId(null)}
          eventId={eventId}
          attendees={results.map((r) => ({ id: r.id, firstName: r.firstName, lastName: r.lastName }))}
          defaultAttendeeId={incidentAttendeeId}
          handleAddIncidencia={() => {
            setIncidentAttendeeId(null)
            void refreshStats(eventId)
          }}
        />
      )}
    </div>
  )
}

function Metric({ label, value, className }: { label: string; value?: number; className?: string }) {
  return (
    <div className="rounded-xl bg-muted/60 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${className ?? ""}`}>{value ?? "—"}</p>
    </div>
  )
}

function ScanIllustration() {
  return <QrCode className="size-8" />
}

export default CheckinConsole
