"use client"

import Link from "next/link"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/infrastructure/shadcn/components/ui/sidebar"

export interface NavItem {
  title: string
  description?: string
  url: string
  icon?: React.ReactNode
  isActive?: boolean
}

export function NavMain({ label, items }: { label: string; items: NavItem[] }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
        {label}
      </SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              size="lg"
              isActive={item.isActive}
              tooltip={item.title}
              className="h-14 gap-3 rounded-xl px-3 transition-colors hover:bg-sidebar-accent/80 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-[0_8px_20px_-10px_rgba(0,0,0,0.45)] [&>svg]:size-5"
            >
              <Link href={item.url}>
                {item.icon}
                <span className="grid flex-1 text-left leading-tight">
                  <span className="text-[15px] font-semibold">{item.title}</span>
                  {item.description && (
                    <span className="truncate text-xs font-normal opacity-70">{item.description}</span>
                  )}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
