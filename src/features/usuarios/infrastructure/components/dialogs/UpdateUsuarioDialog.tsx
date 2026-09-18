"use client"

import { UpdateUsuario, UpdateUsuarioSchema } from "@/features/usuarios/domain/validations/updateUsuario"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/infrastructure/shadcn/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/shared/infrastructure/shadcn/components/ui/field"
import { Controller, useForm } from "react-hook-form"

import { Usuario } from "@/features/usuarios/domain/Usuario"
import { updateUsuarioAction } from "@/features/usuarios/infrastructure/actions/updateUsuarioAction"
import { Button } from "@/shared/infrastructure/shadcn/components/ui/button"
import { Input } from "@/shared/infrastructure/shadcn/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/infrastructure/shadcn/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTransition } from "react"
import { toast } from "sonner"

interface UpdateUsuarioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario: Usuario
  handleUpdateUsuario: (usuario: Usuario) => void
}

export function UpdateUsuarioDialog({ open, onOpenChange, usuario, handleUpdateUsuario }: UpdateUsuarioDialogProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<UpdateUsuario>({
    resolver: zodResolver(UpdateUsuarioSchema),
    defaultValues: {
      name: usuario.name ?? "",
      email: usuario.email ?? "",
      role: usuario.role,
    },
  })

  const onSubmit = async (data: UpdateUsuario) => {
    startTransition(async () => {
      const result = await updateUsuarioAction(usuario.id, data)
      if (result.success && result.data) {
        handleUpdateUsuario({
          id: result.data.id,
          name: result.data.name,
          email: result.data.email,
          role: result.data.role,
          isActive: result.data.isActive,
        })
        onOpenChange(false)
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
          <DialogDescription>Actualiza los datos de contacto y el rol.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} id="update-usuario-form">
          <div className="no-scrollbar max-h-[60vh] overflow-y-auto space-y-2 -mx-2 p-2">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="update-usuario-name">Nombre completo</FieldLabel>
                  <Input {...field} id="update-usuario-name" aria-invalid={fieldState.invalid} autoComplete="off" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="update-usuario-email">Correo electrónico</FieldLabel>
                  <Input {...field} id="update-usuario-email" type="email" aria-invalid={fieldState.invalid} autoComplete="off" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="role"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="update-usuario-role">Rol</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="update-usuario-role" className="w-full" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COLABORADOR">Colaborador</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" id="update-usuario-submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default UpdateUsuarioDialog
