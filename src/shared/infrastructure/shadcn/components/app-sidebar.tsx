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
import { Earth, LayoutDashboardIcon, PackageIcon } from "lucide-react"
import { MAIN_ROUTE } from "@/shared/infrastructure/utils/routes"

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: {
    name: string
    email: string
    avatar: string
  }
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname()

  const navMain = [
    {
      title: "Inicio",
      url: MAIN_ROUTE,
      icon: <LayoutDashboardIcon />,
      isActive: pathname === MAIN_ROUTE,
    },
    {
      title: "Productos",
      url: "/productos",
      icon: <PackageIcon />,
      isActive: pathname === "/productos",
    },
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
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Earth className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">TEMPLATE</span>
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
