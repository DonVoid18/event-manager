"use client"

import {
  CreateAsistente,
  getAsistenteSchema,
} from "@/features/asistentes/domain/validations/createAsistente"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/infrastructure/shadcn/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/shared/infrastructure/shadcn/components/ui/field"
import { Controller, useForm, type Resolver } from "react-hook-form"

import { Asistente } from "@/features/asistentes/domain/Asistente"
import { EventoType } from "@/features/eventos/domain/Evento"
import { createAsistenteAction } from "@/features/asistentes/infrastructure/actions/createAsistenteAction"
import { consultarDniAction } from "@/features/asistentes/infrastructure/actions/consultarDniAction"
import { Button } from "@/shared/infrastructure/shadcn/components/ui/button"
import { Input } from "@/shared/infrastructure/shadcn/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle, Search } from "lucide-react"
import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { toast } from "sonner"

interface CreateAsistenteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventId: string
  eventType: EventoType
  handleAddAsistente: (asistente: Asistente) => void
}

export function CreateAsistenteDialog({
  open,
  onOpenChange,
  eventId,
  eventType,
  handleAddAsistente,
}: CreateAsistenteDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [isSearchingDni, setIsSearchingDni] = useState(false)
  const lastSearchedDni = useRef("")
  const lookupRequest = useRef(0)
  const [receipt, setReceipt] = useState<File | null>(null)
  const isPago = eventType === "PAGO"

  const form = useForm<CreateAsistente>({
    resolver: zodResolver(getAsistenteSchema(eventType)) as Resolver<CreateAsistente>,
    defaultValues: {
      firstName: "",
      lastName: "",
      documentId: "",
      email: "",
      phone: "",
      ...(isPago ? { paymentAmount: "" as unknown as number, paymentReference: "" } : {}),
    },
  })

  const documentId = form.watch("documentId")
  const handleSearchDni = useCallback(async (dni: string) => {
    if (!/^\d{8}$/.test(dni)) return

    lastSearchedDni.current = dni
    const request = ++lookupRequest.current
    setIsSearchingDni(true)

    try {
      const result = await consultarDniAction(dni)
      if (request !== lookupRequest.current || form.getValues("documentId") !== dni) return

      if (result.success && result.data) {
        form.setValue("firstName", result.data.firstName, { shouldValidate: true })
        form.setValue("lastName", result.data.lastName, { shouldValidate: true })
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch {
      if (request === lookupRequest.current) {
        toast.error("No se pudo consultar el DNI. Completa los nombres manualmente o vuelve a intentar.")
      }
    } finally {
      if (request === lookupRequest.current) setIsSearchingDni(false)
    }
  }, [form])

  useEffect(() => {
    if (!/^\d{8}$/.test(documentId)) {
      lastSearchedDni.current = ""
      lookupRequest.current += 1
      setIsSearchingDni(false)
    } else if (lastSearchedDni.current !== documentId) {
      void handleSearchDni(documentId)
    }
  }, [documentId, handleSearchDni])

  const onSubmit = async (data: CreateAsistente) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append("firstName", data.firstName)
      formData.append("lastName", data.lastName)
      formData.append("documentId", data.documentId)
      formData.append("email", data.email)
      formData.append("phone", data.phone ?? "")

      if (isPago) {
        formData.append("paymentAmount", String(data.paymentAmount ?? ""))
        formData.append("paymentReference", data.paymentReference ?? "")
        if (receipt) {
          formData.append("receipt", receipt)
        }
      }

      const result = await createAsistenteAction(eventId, formData)
      if (result.success && result.data) {
        handleAddAsistente({
          id: result.data.id,
          eventId: result.data.eventId,
          firstName: result.data.firstName,
          lastName: result.data.lastName,
          documentId: result.data.documentId,
          email: result.data.email,
          phone: result.data.phone,
          paymentAmount: result.data.paymentAmount,
          paymentReference: result.data.paymentReference,
          paymentReceiptKey: result.data.paymentReceiptKey,
          createdAt: result.data.createdAt,
          invitation: null,
          checkIn: null,
        })
        form.reset()
        setReceipt(null)
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
          <DialogTitle>Registrar asistente</DialogTitle>
          <DialogDescription>
            {isPago
              ? "Este evento es de pago. Completa los datos personales y el comprobante de pago."
              : "Completa los datos personales del asistente."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} id="create-asistente-form">
          <div className="no-scrollbar max-h-[60vh] overflow-y-auto space-y-2 -mx-2 p-2">
            <Controller
              name="documentId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="documentId">Documento de identidad (DNI)</FieldLabel>
                  <div className="relative">
                    <Input {...field} id="documentId" aria-invalid={fieldState.invalid} aria-busy={isSearchingDni} autoComplete="off" className="pr-10" />
                    <button
                      type="button"
                      aria-label="Consultar DNI"
                      title="Consultar DNI"
                      onClick={() => void handleSearchDni(field.value)}
                      disabled={isSearchingDni || isPending || !/^\d{8}$/.test(field.value)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSearchingDni ? <LoaderCircle className="size-4 animate-spin" /> : <Search className="size-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Al ingresar un DNI de 8 dígitos se completarán los nombres y apellidos.</p>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <div className="grid grid-cols-2 gap-2">
              <Controller
                name="firstName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="firstName">Nombres</FieldLabel>
                    <Input {...field} id="firstName" aria-invalid={fieldState.invalid} autoComplete="off" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="lastName"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="lastName">Apellidos</FieldLabel>
                    <Input {...field} id="lastName" aria-invalid={fieldState.invalid} autoComplete="off" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                    <Input {...field} id="email" type="email" aria-invalid={fieldState.invalid} autoComplete="off" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
                    <Input {...field} id="phone" aria-invalid={fieldState.invalid} autoComplete="off" />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            {isPago && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Controller
                    name="paymentAmount"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="paymentAmount">Monto pagado</FieldLabel>
                        <Input
                          {...field}
                          id="paymentAmount"
                          type="number"
                          step="0.01"
                          aria-invalid={fieldState.invalid}
                          onChange={(e) => {
                            const val = e.target.value === "" ? "" : Number(e.target.value)
                            field.onChange(val)
                          }}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    name="paymentReference"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="paymentReference">N.º de comprobante</FieldLabel>
                        <Input {...field} id="paymentReference" aria-invalid={fieldState.invalid} autoComplete="off" />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                </div>

                <Field>
                  <FieldLabel htmlFor="receipt">Comprobante de pago (imagen o PDF)</FieldLabel>
                  <Input
                    id="receipt"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(event) => setReceipt(event.target.files?.[0] ?? null)}
                  />
                </Field>
              </>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" id="create-asistente-submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateAsistenteDialog
