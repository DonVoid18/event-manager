"use client"

import { Badge } from "@/shared/infrastructure/shadcn/components/ui/badge"
import { Button } from "@/shared/infrastructure/shadcn/components/ui/button"
import { Switch } from "@/shared/infrastructure/shadcn/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/infrastructure/shadcn/components/ui/table"
import { Edit, Plus } from "lucide-react"
import { Usuario } from "@/features/usuarios/domain/Usuario"
import { toggleUsuarioActivoAction } from "@/features/usuarios/infrastructure/actions/toggleUsuarioActivoAction"
import { useTransition } from "react"
import { toast } from "sonner"

interface UsuarioTableProps {
  data: Usuario[]
  currentUserId: string
  onEdit: (usuario: Usuario) => void
  onToggleActive: (usuario: Usuario) => void
  onOpenAddDialog?: () => void
}

export function UsuarioTable({ data, currentUserId, onEdit, onToggleActive, onOpenAddDialog }: UsuarioTableProps) {
  const [isPending, startTransition] = useTransition()

  const handleToggle = (usuario: Usuario, checked: boolean) => {
    startTransition(async () => {
      const result = await toggleUsuarioActivoAction(usuario.id, checked)
      if (result.success && result.data) {
        onToggleActive({ ...usuario, isActive: result.data.isActive })
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Usuarios y roles</h1>
          <p className="text-sm text-muted-foreground">{data.length} usuario(s)</p>
        </div>
        <Button variant="default" onClick={onOpenAddDialog}>
          <Plus className="mr-2 size-4" />
          Nuevo usuario
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length ? (
              data.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">{usuario.name}</TableCell>
                  <TableCell className="text-muted-foreground">{usuario.email}</TableCell>
                  <TableCell>
                    <Badge variant={usuario.role === "ADMIN" ? "default" : "secondary"}>
                      {usuario.role === "ADMIN" ? "Administrador" : "Colaborador"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={usuario.isActive}
                      disabled={isPending || usuario.id === currentUserId}
                      onCheckedChange={(checked) => handleToggle(usuario, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(usuario)}>
                      <Edit className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No hay usuarios registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default UsuarioTable
