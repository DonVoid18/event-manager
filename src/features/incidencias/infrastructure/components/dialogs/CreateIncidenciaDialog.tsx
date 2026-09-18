"use client"

import {
  CreateIncidencia,
  CreateIncidenciaSchema,
} from "@/features/incidencias/domain/validations/createIncidencia"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/infrastructure/shadcn/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/shared/infrastructure/shadcn/components/ui/field"
import { Controller, useForm } from "react-hook-form"

import { Incidencia } from "@/features/incidencias/domain/Incidencia"
import { createIncidenciaAction } from "@/features/incidencias/infrastructure/actions/createIncidenciaAction"
import { Button } from "@/shared/infrastructure/shadcn/components/ui/button"
import { Textarea } from "@/shared/infrastructure/shadcn/components/ui/textarea"
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

interface CreateIncidenciaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  attendees: { id: string; firstName: string; lastName: string }[]
  defaultAttendeeId?: string
  handleAddIncidencia: (incidencia: Incidencia) => void
}

export function CreateIncidenciaDialog({
  open,
  onOpenChange,
  eventId,
  attendees,
  defaultAttendeeId,
  handleAddIncidencia,
}: CreateIncidenciaDialogProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<CreateIncidencia>({
    resolver: zodResolver(CreateIncidenciaSchema),
    defaultValues: {
      description: "",
      category: "OTRO",
      attendeeId: defaultAttendeeId ?? "",
    },
  })

  const onSubmit = async (data: CreateIncidencia) => {
    startTransition(async () => {
      const result = await createIncidenciaAction(eventId, data)
      if (result.success && result.data) {
        handleAddIncidencia(result.data)
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
          <DialogTitle>Registrar incidencia</DialogTitle>
          <DialogDescription>
            Documenta los problemas presentados durante el check-in u organización del evento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} id="create-incidencia-form">
          <div className="no-scrollbar max-h-[60vh] overflow-y-auto space-y-2 -mx-2 p-2">
            <Controller
              name="category"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="category">Categoría</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="category" className="w-full" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACCESO">Acceso</SelectItem>
                      <SelectItem value="DOCUMENTACION">Documentación</SelectItem>
                      <SelectItem value="PAGO">Pago</SelectItem>
                      <SelectItem value="TECNICA">Técnica</SelectItem>
                      <SelectItem value="OTRO">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="attendeeId"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="attendeeId">Asistente relacionado (opcional)</FieldLabel>
                  <Select value={field.value || "NONE"} onValueChange={(v) => field.onChange(v === "NONE" ? "" : v)}>
                    <SelectTrigger id="attendeeId" className="w-full">
                      <SelectValue placeholder="Ninguno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Ninguno</SelectItem>
                      {attendees.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.firstName} {a.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />

            <Controller
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="description">Descripción</FieldLabel>
                  <Textarea
                    {...field}
                    id="description"
                    aria-invalid={fieldState.invalid}
                    placeholder="Describe lo ocurrido..."
                    rows={4}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" id="create-incidencia-submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateIncidenciaDialog
