"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/infrastructure/shadcn/components/ui/select"
import { InvitationStatus } from "@/features/asistentes/domain/Asistente"
import { updateInvitationStatusAction } from "@/features/invitaciones/infrastructure/actions/updateInvitationStatusAction"
import { useTransition } from "react"
import { toast } from "sonner"

interface InvitationStatusSelectProps {
  invitationId: string
  status: InvitationStatus
  onStatusChange: (status: InvitationStatus) => void
}

export function InvitationStatusSelect({ invitationId, status, onStatusChange }: InvitationStatusSelectProps) {
  const [isPending, startTransition] = useTransition()

  const handleChange = (value: string) => {
    const newStatus = value as InvitationStatus
    startTransition(async () => {
      const result = await updateInvitationStatusAction(invitationId, { status: newStatus })
      if (result.success) {
        onStatusChange(newStatus)
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger size="sm" className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="PENDIENTE">Pendiente</SelectItem>
        <SelectItem value="ENVIADA">Enviada</SelectItem>
        <SelectItem value="CONFIRMADA">Confirmada</SelectItem>
      </SelectContent>
    </Select>
  )
}

export default InvitationStatusSelect
