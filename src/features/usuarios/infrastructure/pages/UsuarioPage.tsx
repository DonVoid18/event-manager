"use client"

import { Usuario } from "@/features/usuarios/domain/Usuario"
import { CreateUsuarioDialog } from "../components/dialogs/CreateUsuarioDialog"
import { UpdateUsuarioDialog } from "../components/dialogs/UpdateUsuarioDialog"
import { UsuarioTable } from "../components/tables/UsuarioTable"
import { useState } from "react"
import { PageHeader } from "@/shared/infrastructure/components/PageHeader"
import { StatCard } from "@/shared/infrastructure/components/StatCard"
import { Card, CardContent } from "@/shared/infrastructure/shadcn/components/ui/card"
import { ShieldCheck, UserCheck, UserCog, Users } from "lucide-react"

interface UsuarioPageProps {
  usuarios: Usuario[]
  currentUserId: string
}

type DialogState = { type: "create" } | { type: "update"; usuario: Usuario } | null

export function UsuarioPage({ usuarios: initialUsuarios, currentUserId }: UsuarioPageProps) {
  const [dialog, setDialog] = useState<DialogState>(null)
  const [usuarios, setUsuarios] = useState<Usuario[]>(initialUsuarios)

  const handleAddUsuario = (usuario: Usuario) => {
    setUsuarios((prev) => [usuario, ...prev])
  }

  const handleUpdateUsuario = (usuario: Usuario) => {
    setUsuarios((prev) => prev.map((item) => (item.id === usuario.id ? usuario : item)))
  }

  const admins = usuarios.filter((u) => u.role === "ADMIN").length
  const activos = usuarios.filter((u) => u.isActive).length

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administración"
        title="Usuarios y roles"
        description="Gestiona las cuentas de acceso y los permisos de administradores y colaboradores."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Usuarios" value={usuarios.length} icon={Users} tone="sky" />
        <StatCard label="Administradores" value={admins} icon={ShieldCheck} tone="violet" />
        <StatCard label="Colaboradores" value={usuarios.length - admins} icon={UserCog} tone="slate" />
        <StatCard label="Cuentas activas" value={activos} icon={UserCheck} tone="emerald"
          progress={usuarios.length ? activos / usuarios.length : 0} />
      </div>
      <Card className="shadow-sm">
        <CardContent>
      <UsuarioTable
        data={usuarios}
        currentUserId={currentUserId}
        onEdit={(usuario) => setDialog({ type: "update", usuario })}
        onToggleActive={handleUpdateUsuario}
        onOpenAddDialog={() => setDialog({ type: "create" })}
      />
        </CardContent>
      </Card>
      {dialog && (
        <>
          {dialog.type === "create" && (
            <CreateUsuarioDialog
              open
              onOpenChange={(open) => !open && setDialog(null)}
              handleAddUsuario={handleAddUsuario}
            />
          )}
          {dialog.type === "update" && (
            <UpdateUsuarioDialog
              open
              onOpenChange={(open) => !open && setDialog(null)}
              usuario={dialog.usuario}
              handleUpdateUsuario={handleUpdateUsuario}
            />
          )}
        </>
      )}
    </div>
  )
}

export default UsuarioPage
