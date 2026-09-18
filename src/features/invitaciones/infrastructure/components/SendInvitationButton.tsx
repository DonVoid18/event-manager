"use client"

import { Button } from "@/shared/infrastructure/shadcn/components/ui/button"
import { sendInvitationAction } from "@/features/invitaciones/infrastructure/actions/sendInvitationAction"
import { AsistenteInvitacion } from "@/features/asistentes/domain/Asistente"
import { Send } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"

interface SendInvitationButtonProps {
  attendeeId: string
  onSent: (invitation: AsistenteInvitacion) => void
}

export function SendInvitationButton({ attendeeId, onSent }: SendInvitationButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      const result = await sendInvitationAction(attendeeId)
      if (result.success && result.data) {
        onSent({
          id: result.data.id,
          code: result.data.code,
          status: result.data.status,
          sentAt: result.data.sentAt,
        })
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Button size="sm" variant="outline" onClick={handleClick} disabled={isPending}>
      <Send className="mr-2 size-3.5" />
      {isPending ? "Enviando..." : "Enviar invitación"}
    </Button>
  )
}

export default SendInvitationButton
