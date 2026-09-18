"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { NavMain } from "@/shared/infrastructure/shadcn/components/nav-main"
import { NavUser } from "@/shared/infrastructure/shadcn/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/shared/infrastructure/shadcn/components/ui/sidebar"
import {
  CalendarClock,
  CalendarDays,
  FileBarChart,
  LayoutDashboardIcon,
  PackageIcon,
  ScanLine,
  Users,
} from "lucide-react"
import {
  CHECKIN_ROUTE,
  EVENTOS_ROUTE,
  MAIN_ROUTE,
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

  const navMain = [
    {
      title: "Inicio",
      url: MAIN_ROUTE,
      icon: <LayoutDashboardIcon />,
      isActive: pathname === MAIN_ROUTE,
    },
    {
      title: "Eventos",
      url: EVENTOS_ROUTE,
      icon: <CalendarDays />,
      isActive: pathname.startsWith(EVENTOS_ROUTE),
    },
    {
      title: "Check-in",
      url: CHECKIN_ROUTE,
      icon: <ScanLine />,
      isActive: pathname.startsWith(CHECKIN_ROUTE),
    },
    {
      title: "Reportes",
      url: REPORTES_ROUTE,
      icon: <FileBarChart />,
      isActive: pathname.startsWith(REPORTES_ROUTE),
    },
    {
      title: "Productos",
      url: "/productos",
      icon: <PackageIcon />,
      isActive: pathname === "/productos",
    },
    ...(role === "ADMIN"
      ? [
        {
          title: "Usuarios",
          url: USUARIOS_ROUTE,
          icon: <Users />,
          isActive: pathname.startsWith(USUARIOS_ROUTE),
        },
      ]
      : []),
  ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-1 group-data-[collapsible=icon]:flex-col">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="cursor-default hover:bg-transparent hover:text-sidebar-foreground active:bg-transparent"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-700 text-primary-foreground shadow-sm">
                  <CalendarClock className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">TUMITECH</span>
                  <span className="truncate text-xs text-muted-foreground">Gestión de Eventos</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarTrigger className="shrink-0" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
