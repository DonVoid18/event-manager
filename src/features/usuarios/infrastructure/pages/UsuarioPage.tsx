"use client"

import { Usuario } from "@/features/usuarios/domain/Usuario"
import { CreateUsuarioDialog } from "../components/dialogs/CreateUsuarioDialog"
import { UpdateUsuarioDialog } from "../components/dialogs/UpdateUsuarioDialog"
import { UsuarioTable } from "../components/tables/UsuarioTable"
import { useState } from "react"

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

  return (
    <div className="space-y-4">
      <UsuarioTable
        data={usuarios}
        currentUserId={currentUserId}
        onEdit={(usuario) => setDialog({ type: "update", usuario })}
        onToggleActive={handleUpdateUsuario}
        onOpenAddDialog={() => setDialog({ type: "create" })}
      />
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
