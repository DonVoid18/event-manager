"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { History } from "lucide-react"

import { AsistenteInvitacion } from "@/features/asistentes/domain/Asistente"
import { InvitationQrCode } from "@/features/invitaciones/infrastructure/components/InvitationQrCode"
import {
  INVITATION_STATUS_LABELS,
  InvitationStatusBadge,
} from "@/features/invitaciones/infrastructure/components/InvitationStatusBadge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/infrastructure/shadcn/components/ui/dialog"
import { cn } from "@/shared/infrastructure/shadcn/lib/utils"

const DOT_STYLES = {
  PENDIENTE: "bg-slate-400",
  ENVIADA: "bg-sky-600",
  CONFIRMADA: "bg-emerald-600",
} as const

interface InvitationDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  attendeeName: string
  invitation: AsistenteInvitacion
}

/** Muestra el código QR de la invitación y el historial de cambios de estado (RF04). */
export function InvitationDetailDialog({ open, onOpenChange, attendeeName, invitation }: InvitationDetailDialogProps) {
  const history = invitation.history ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invitación de {attendeeName}</DialogTitle>
          <DialogDescription>Código para el check-in y seguimiento de su estado.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
          <div className="flex flex-col items-center gap-3">
            <InvitationQrCode code={invitation.code} size={190} />
            <span className="rounded-md bg-muted px-3 py-1 font-mono text-sm font-semibold tracking-widest">
              {invitation.code}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="text-xs text-muted-foreground">Estado actual</p>
                <InvitationStatusBadge status={invitation.status} className="mt-1 text-sm" />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Último envío</p>
                <p className="text-sm font-medium">
                  {invitation.sentAt
                    ? format(new Date(invitation.sentAt), "dd MMM yyyy, HH:mm", { locale: es })
                    : "Sin enviar"}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <History className="size-4" /> Historial de estados
              </p>
              {history.length ? (
                <ol className="relative space-y-4 border-l pl-6">
                  {[...history].reverse().map((entry, index) => (
                    <li key={`${entry.status}-${index}`} className="relative">
                      <span
                        className={cn(
                          "absolute -left-[31px] top-1 size-3.5 rounded-full ring-4 ring-background",
                          DOT_STYLES[entry.status]
                        )}
                      />
                      <p className="text-sm font-medium">{INVITATION_STATUS_LABELS[entry.status]}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(entry.changedAt), "EEEE d 'de' MMMM yyyy, HH:mm", { locale: es })}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">Aún no hay cambios de estado registrados.</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default InvitationDetailDialog
