"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/infrastructure/shadcn/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/shared/infrastructure/shadcn/components/ui/dropdown-menu"
import { signOut } from "next-auth/react"
import { LogOutIcon, Sun, Moon, Laptop, User } from "lucide-react"
import Link from "next/link"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex h-14 w-full min-w-0 items-center gap-3 overflow-hidden rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-2.5 text-left text-sidebar-accent-foreground shadow-xs transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus:outline-none focus:ring-2 focus:ring-sidebar-ring group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0!"
        >
          <Avatar className="h-9 w-9 shrink-0 rounded-full border border-sidebar-border shadow-sm">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="rounded-full bg-teal-700 text-white text-sm font-semibold">
              {user.name ? user.name.slice(0, 2).toUpperCase() : "US"}
            </AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-semibold">{user.name}</span>
            <span className="truncate text-xs text-sidebar-foreground/70">{user.email}</span>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-56"
        side="top"
        align="start"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-full">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-full bg-primary/10 text-primary text-xs font-semibold">
                {user.name ? user.name.slice(0, 2).toUpperCase() : "US"}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href="/perfil" className="flex items-center w-full">
              <User className="mr-2 h-4 w-4" />
              <span>Mi Perfil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <Sun className="h-4 w-4 mr-2 dark:hidden" />
              <Moon className="h-4 w-4 mr-2 hidden dark:block" />
              <span>Tema</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={mounted ? theme : "system"} onValueChange={setTheme}>
                <DropdownMenuRadioItem value="light" className="cursor-pointer">
                  <Sun className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Claro</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark" className="cursor-pointer">
                  <Moon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Oscuro</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system" className="cursor-pointer">
                  <Laptop className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Sistema</span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()} className="text-destructive focus:text-destructive cursor-pointer">
          <LogOutIcon className="mr-2 h-4 w-4" />
          <span>Cerrar sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

