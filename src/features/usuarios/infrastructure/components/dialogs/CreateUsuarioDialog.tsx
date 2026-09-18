"use client"

import { CreateUsuario, CreateUsuarioSchema } from "@/features/usuarios/domain/validations/createUsuario"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/infrastructure/shadcn/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/shared/infrastructure/shadcn/components/ui/field"
import { Controller, useForm } from "react-hook-form"

import { Usuario } from "@/features/usuarios/domain/Usuario"
import { createUsuarioAction } from "@/features/usuarios/infrastructure/actions/createUsuarioAction"
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

interface CreateUsuarioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  handleAddUsuario: (usuario: Usuario) => void
}

export function CreateUsuarioDialog({ open, onOpenChange, handleAddUsuario }: CreateUsuarioDialogProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<CreateUsuario>({
    resolver: zodResolver(CreateUsuarioSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "COLABORADOR",
    },
  })

  const onSubmit = async (data: CreateUsuario) => {
    startTransition(async () => {
      const result = await createUsuarioAction(data)
      if (result.success && result.data) {
        handleAddUsuario({
          id: result.data.id,
          name: result.data.name,
          email: result.data.email,
          role: result.data.role,
          isActive: result.data.isActive,
        })
        form.reset()
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
          <DialogTitle>Crear usuario</DialogTitle>
          <DialogDescription>
            Registra una nueva cuenta y asigna el rol correspondiente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} id="create-usuario-form">
          <div className="no-scrollbar max-h-[60vh] overflow-y-auto space-y-2 -mx-2 p-2">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="usuario-name">Nombre completo</FieldLabel>
                  <Input {...field} id="usuario-name" aria-invalid={fieldState.invalid} autoComplete="off" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="usuario-email">Correo electrónico</FieldLabel>
                  <Input {...field} id="usuario-email" type="email" aria-invalid={fieldState.invalid} autoComplete="off" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="usuario-password">Contraseña</FieldLabel>
                  <Input {...field} id="usuario-password" type="password" aria-invalid={fieldState.invalid} autoComplete="new-password" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              name="role"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="usuario-role">Rol</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="usuario-role" className="w-full" aria-invalid={fieldState.invalid}>
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
            <Button type="submit" id="create-usuario-submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Crear usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateUsuarioDialog
