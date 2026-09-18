"use client"

import { CreateEvento, CreateEventoSchema } from "@/features/eventos/domain/validations/createEvento"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/infrastructure/shadcn/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/shared/infrastructure/shadcn/components/ui/field"
import { Controller, useForm } from "react-hook-form"

import { Evento } from "@/features/eventos/domain/Evento"
import { createEventoAction } from "@/features/eventos/infrastructure/actions/createEventoAction"
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

interface CreateEventoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  handleAddEvento: (evento: Evento) => void
}

export function CreateEventoDialog({ open, onOpenChange, handleAddEvento }: CreateEventoDialogProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<CreateEvento>({
    resolver: zodResolver(CreateEventoSchema),
    defaultValues: {
      name: "",
      eventDate: "",
      type: "GRATUITO",
      capacity: "" as unknown as number,
    },
  })

  const onSubmit = async (data: CreateEvento) => {
    startTransition(async () => {
      const result = await createEventoAction(data)
      if (result.success && result.data) {
        handleAddEvento({
          id: result.data.id,
          code: result.data.code,
          name: result.data.name,
          eventDate: result.data.eventDate,
          type: result.data.type,
          capacity: result.data.capacity,
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
          <DialogTitle>Registrar evento</DialogTitle>
          <DialogDescription>
            Completa los datos del nuevo evento. Se asignará un código único automáticamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} id="create-evento-form">
          <div className="no-scrollbar max-h-[60vh] overflow-y-auto space-y-2 -mx-2 p-2">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="name">Nombre del evento</FieldLabel>
                  <Input
                    {...field}
                    id="name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Nombre del evento"
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
                  <FieldLabel htmlFor="eventDate">Fecha y hora</FieldLabel>
                  <Input
                    {...field}
                    id="eventDate"
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
                  <FieldLabel htmlFor="type">Tipo de evento</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="type" className="w-full" aria-invalid={fieldState.invalid}>
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
                  <FieldLabel htmlFor="capacity">Aforo máximo</FieldLabel>
                  <Input
                    {...field}
                    id="capacity"
                    type="number"
                    min={1}
                    step="1"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ej. 100"
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
            <Button type="submit" id="create-evento-submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateEventoDialog
