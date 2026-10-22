"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDays } from "lucide-react"
import { usePathname } from "next/navigation"

import { Separator } from "@/shared/infrastructure/shadcn/components/ui/separator"
import { SidebarTrigger } from "@/shared/infrastructure/shadcn/components/ui/sidebar"

const SECTIONS: { match: (path: string) => boolean; title: string; subtitle: string }[] = [
  { match: (p) => p === "/", title: "Centro de operaciones", subtitle: "Resumen general de eventos, asistentes y accesos" },
  { match: (p) => /^\/eventos\/.+/.test(p), title: "Detalle del evento", subtitle: "Registro de asistentes, invitaciones e incidencias" },
  { match: (p) => p.startsWith("/eventos"), title: "Eventos", subtitle: "Crea, consulta y gestiona los eventos de la empresa" },
  { match: (p) => p.startsWith("/checkin"), title: "Check-in", subtitle: "Control de ingreso el día del evento" },
  { match: (p) => p.startsWith("/reportes"), title: "Reportes", subtitle: "Indicadores consolidados y exportación" },
  { match: (p) => p.startsWith("/usuarios"), title: "Usuarios", subtitle: "Cuentas, roles y permisos" },
  { match: (p) => p.startsWith("/perfil"), title: "Mi perfil", subtitle: "Datos personales y contraseña" },
]

export function AppHeader() {
  const pathname = usePathname()
  const section = SECTIONS.find((s) => s.match(pathname))
  const rawToday = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
  const today = rawToday.charAt(0).toUpperCase() + rawToday.slice(1)

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur md:px-8">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-6" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold leading-tight">{section?.title ?? "TUMITECH"}</p>
        {section && (
          <p className="hidden truncate text-xs text-muted-foreground sm:block">{section.subtitle}</p>
        )}
      </div>
      <div className="hidden items-center gap-2 rounded-lg border bg-background px-3 py-1.5 text-sm text-muted-foreground lg:flex">
        <CalendarDays className="size-4" />
        <span>{today}</span>
      </div>
    </header>
  )
}

export default AppHeader
