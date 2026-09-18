import { Badge } from "@/shared/infrastructure/shadcn/components/ui/badge"
import { InvitationStatus } from "@/features/asistentes/domain/Asistente"

const LABELS: Record<InvitationStatus, string> = {
  PENDIENTE: "Pendiente",
  ENVIADA: "Enviada",
  CONFIRMADA: "Confirmada",
}

const VARIANTS: Record<InvitationStatus, "warning" | "info" | "success"> = {
  PENDIENTE: "warning",
  ENVIADA: "info",
  CONFIRMADA: "success",
}

export function InvitationStatusBadge({ status }: { status: InvitationStatus | null | undefined }) {
  if (!status) {
    return <Badge variant="outline">Sin invitación</Badge>
  }

  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>
}

export default InvitationStatusBadge
