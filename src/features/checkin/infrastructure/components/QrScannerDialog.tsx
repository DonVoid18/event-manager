"use client"

import jsQR from "jsqr"
import { Camera, CameraOff } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/infrastructure/shadcn/components/ui/dialog"

interface QrScannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDetected: (value: string) => void
}

/** Lee el código QR de la invitación con la cámara del dispositivo. */
export function QrScannerDialog({ open, onOpenChange, onDetected }: QrScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let stream: MediaStream | null = null
    let frame = 0
    let stopped = false

    const scan = () => {
      if (stopped) return
      const video = videoRef.current
      const canvas = canvasRef.current
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const context = canvas.getContext("2d", { willReadFrequently: true })
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height)
          const image = context.getImageData(0, 0, canvas.width, canvas.height)
          const result = jsQR(image.data, image.width, image.height, { inversionAttempts: "dontInvert" })
          if (result?.data) {
            stopped = true
            onDetected(result.data.trim())
            onOpenChange(false)
            return
          }
        }
      }
      frame = requestAnimationFrame(scan)
    }

    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" } })
      .then((media) => {
        stream = media
        if (videoRef.current) {
          videoRef.current.srcObject = media
          void videoRef.current.play()
        }
        frame = requestAnimationFrame(scan)
      })
      .catch(() => setError("No se pudo acceder a la cámara. Revisa los permisos del navegador."))

    if (!navigator.mediaDevices) {
      setError("Este navegador no permite usar la cámara. Busca al asistente por su código.")
    }

    return () => {
      stopped = true
      cancelAnimationFrame(frame)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [open, onDetected, onOpenChange])

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setError(null)
        onOpenChange(value)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="size-5" /> Escanear código QR
          </DialogTitle>
          <DialogDescription>Apunta la cámara al código QR de la invitación del asistente.</DialogDescription>
        </DialogHeader>
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-900">
          {error ? (
            <div className="flex size-full flex-col items-center justify-center gap-3 p-6 text-center text-sm text-white/80">
              <CameraOff className="size-10" />
              {error}
            </div>
          ) : (
            <>
              <video ref={videoRef} className="size-full object-cover" muted playsInline />
              <div className="pointer-events-none absolute inset-10 rounded-2xl border-4 border-white/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.45)]" />
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default QrScannerDialog
