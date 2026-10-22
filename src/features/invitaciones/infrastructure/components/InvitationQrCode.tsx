"use client"

import QRCode from "qrcode"
import { useEffect, useState } from "react"

import { cn } from "@/shared/infrastructure/shadcn/lib/utils"

/** Genera en el navegador la imagen QR del código de invitación. */
export function InvitationQrCode({ code, size = 220, className }: { code: string; size?: number; className?: string }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    QRCode.toDataURL(code, { width: size * 2, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } })
      .then((url) => active && setSrc(url))
      .catch(() => active && setSrc(null))
    return () => {
      active = false
    }
  }, [code, size])

  return (
    <div
      className={cn("flex items-center justify-center rounded-xl border bg-white p-3", className)}
      style={{ width: size + 24, height: size + 24 }}
    >
      {src ? (
        <img src={src} alt={`Código QR de la invitación ${code}`} width={size} height={size} />
      ) : (
        <div className="size-full animate-pulse rounded-lg bg-muted" />
      )}
    </div>
  )
}

export default InvitationQrCode
