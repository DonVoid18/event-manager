import { Badge } from "@/shared/infrastructure/shadcn/components/ui/badge"
import { InvitationStatus } from "@/features/asistentes/domain/Asistente"
import { cn } from "@/shared/infrastructure/shadcn/lib/utils"

export const INVITATION_STATUS_LABELS: Record<InvitationStatus, string> = {
  PENDIENTE: "Pendiente",
  ENVIADA: "Enviada",
  CONFIRMADA: "Confirmada",
}

export const INVITATION_STATUS_STYLES: Record<InvitationStatus, string> = {
  PENDIENTE: "border-slate-200 bg-slate-100 text-slate-600",
  ENVIADA: "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-400/30 dark:bg-teal-400/10 dark:text-teal-200",
  CONFIRMADA: "border-emerald-200 bg-emerald-50 text-emerald-700",
}

export function InvitationStatusBadge({
  status,
  className,
}: {
  status: InvitationStatus | null | undefined
  className?: string
}) {
  if (!status) {
    return <Badge variant="outline" className={cn("text-muted-foreground", className)}>Sin invitación</Badge>
  }

  return (
    <Badge variant="outline" className={cn(INVITATION_STATUS_STYLES[status], className)}>
      {INVITATION_STATUS_LABELS[status]}
    </Badge>
  )
}

export default InvitationStatusBadge
