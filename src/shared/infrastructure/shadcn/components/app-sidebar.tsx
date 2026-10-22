"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { BrandMark } from "@/shared/infrastructure/components/BrandMark"
import { NavMain, type NavItem } from "@/shared/infrastructure/shadcn/components/nav-main"
import { NavUser } from "@/shared/infrastructure/shadcn/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/shared/infrastructure/shadcn/components/ui/sidebar"
import {
  CalendarDays,
  FileBarChart,
  LayoutDashboard,
  ScanLine,
  UserCog,
  Users,
} from "lucide-react"
import {
  CHECKIN_ROUTE,
  EVENTOS_ROUTE,
  MAIN_ROUTE,
  PERFIL_ROUTE,
  REPORTES_ROUTE,
  USUARIOS_ROUTE,
} from "@/shared/infrastructure/utils/routes"

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string
    email: string
    avatar: string
  }
  role: "ADMIN" | "COLABORADOR"
}

export function AppSidebar({ user, role, ...props }: AppSidebarProps) {
  const pathname = usePathname()

  const operacion: NavItem[] = [
    {
      title: "Inicio",
      description: "Centro de operaciones",
      url: MAIN_ROUTE,
      icon: <LayoutDashboard />,
      isActive: pathname === MAIN_ROUTE,
    },
    {
      title: "Eventos",
      description: "Registro e invitaciones",
      url: EVENTOS_ROUTE,
      icon: <CalendarDays />,
      isActive: pathname.startsWith(EVENTOS_ROUTE),
    },
    {
      title: "Check-in",
      description: "Control de ingreso",
      url: CHECKIN_ROUTE,
      icon: <ScanLine />,
      isActive: pathname.startsWith(CHECKIN_ROUTE),
    },
  ]

  const analisis: NavItem[] = [
    {
      title: "Reportes",
      description: "Indicadores y exportación",
      url: REPORTES_ROUTE,
      icon: <FileBarChart />,
      isActive: pathname.startsWith(REPORTES_ROUTE),
    },
  ]

  const administracion: NavItem[] = [
    ...(role === "ADMIN"
      ? [
        {
          title: "Usuarios",
          description: "Cuentas y roles",
          url: USUARIOS_ROUTE,
          icon: <Users />,
          isActive: pathname.startsWith(USUARIOS_ROUTE),
        },
      ]
      : []),
    {
      title: "Mi perfil",
      description: "Datos y contraseña",
      url: PERFIL_ROUTE,
      icon: <UserCog />,
      isActive: pathname.startsWith(PERFIL_ROUTE),
    },
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/70 px-4 pb-7 pt-8 group-data-[collapsible=icon]:px-2">
        <BrandMark tone="dark" className="group-data-[collapsible=icon]:hidden" />
        <BrandMark tone="dark" compact className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center" />
      </SidebarHeader>
      <SidebarContent className="gap-3 px-2 py-4 group-data-[collapsible=icon]:px-0">
        <NavMain label="Operación" items={operacion} />
        <NavMain label="Análisis" items={analisis} />
        <NavMain label="Administración" items={administracion} />
      </SidebarContent>
      <SidebarFooter className="p-3">
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
