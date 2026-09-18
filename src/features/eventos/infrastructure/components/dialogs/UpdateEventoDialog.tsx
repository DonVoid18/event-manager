"use client"

import { CreateEvento, CreateEventoSchema } from "@/features/eventos/domain/validations/createEvento"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/infrastructure/shadcn/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/shared/infrastructure/shadcn/components/ui/field"
import { Controller, useForm } from "react-hook-form"

import { Evento } from "@/features/eventos/domain/Evento"
import { updateEventoAction } from "@/features/eventos/infrastructure/actions/updateEventoAction"
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

interface UpdateEventoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  evento: Evento
  handleUpdateEvento: (evento: Evento) => void
}

const toDatetimeLocalValue = (date: Date) => {
  const d = new Date(date)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function UpdateEventoDialog({ open, onOpenChange, evento, handleUpdateEvento }: UpdateEventoDialogProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<CreateEvento>({
    resolver: zodResolver(CreateEventoSchema),
    defaultValues: {
      name: evento.name,
      eventDate: toDatetimeLocalValue(evento.eventDate),
      type: evento.type,
      capacity: evento.capacity,
    },
  })

  const onSubmit = async (data: CreateEvento) => {
    startTransition(async () => {
      const result = await updateEventoAction(evento.id, data)
      if (result.success && result.data) {
        handleUpdateEvento({
          id: result.data.id,
          code: result.data.code,
          name: result.data.name,
          eventDate: result.data.eventDate,
          type: result.data.type,
          capacity: result.data.capacity,
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
          <DialogTitle>Editar evento</DialogTitle>
          <DialogDescription>Código: {evento.code}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} id="update-evento-form">
          <div className="no-scrollbar max-h-[60vh] overflow-y-auto space-y-2 -mx-2 p-2">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="update-name">Nombre del evento</FieldLabel>
                  <Input
                    {...field}
                    id="update-name"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="eventDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="update-eventDate">Fecha y hora</FieldLabel>
                  <Input
                    {...field}
                    id="update-eventDate"
                    type="datetime-local"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="type"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="update-type">Tipo de evento</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="update-type" className="w-full" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GRATUITO">Gratuito</SelectItem>
                      <SelectItem value="PAGO">De pago</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="capacity"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="update-capacity">Aforo máximo</FieldLabel>
                  <Input
                    {...field}
                    id="update-capacity"
                    type="number"
                    min={1}
                    step="1"
                    aria-invalid={fieldState.invalid}
                    autoComplete="off"
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : Number(e.target.value)
                      field.onChange(val)
                    }}
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
            <Button type="submit" id="update-evento-submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default UpdateEventoDialog
