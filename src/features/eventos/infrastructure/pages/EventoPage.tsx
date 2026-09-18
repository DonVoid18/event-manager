"use client"

import { EventoConMetricas } from "@/features/eventos/domain/Evento"
import { CreateEventoDialog } from "../components/dialogs/CreateEventoDialog"
import { UpdateEventoDialog } from "../components/dialogs/UpdateEventoDialog"
import { EventoTable } from "../components/tables/EventoTable"
import { useState } from "react"

interface EventoPageProps {
  eventos: EventoConMetricas[]
}

type DialogState =
  | { type: "create" }
  | { type: "update"; evento: EventoConMetricas }
  | null

export function EventoPage({ eventos: initialEventos }: EventoPageProps) {
  const [dialog, setDialog] = useState<DialogState>(null)
  const [eventos, setEventos] = useState<EventoConMetricas[]>(initialEventos)

  const handleAddEvento = (nuevo: Omit<EventoConMetricas, "registeredCount" | "checkedInCount">) => {
    setEventos((prev) => [{ ...nuevo, registeredCount: 0, checkedInCount: 0 }, ...prev])
  }

  const handleUpdateEvento = (actualizado: Omit<EventoConMetricas, "registeredCount" | "checkedInCount">) => {
    setEventos((prev) =>
      prev.map((item) =>
        item.id === actualizado.id ? { ...item, ...actualizado } : item
      )
    )
  }

  return (
    <div className="space-y-4">
      <EventoTable
        data={eventos}
        onEdit={(evento) => setDialog({ type: "update", evento })}
        onOpenAddDialog={() => setDialog({ type: "create" })}
      />
      {dialog && (
        <>
          {dialog.type === "create" && (
            <CreateEventoDialog
              open
              onOpenChange={(open) => !open && setDialog(null)}
              handleAddEvento={handleAddEvento}
            />
          )}
          {dialog.type === "update" && (
            <UpdateEventoDialog
              open
              onOpenChange={(open) => !open && setDialog(null)}
              evento={dialog.evento}
              handleUpdateEvento={handleUpdateEvento}
            />
          )}
        </>
      )}
    </div>
  )
}

export default EventoPage
