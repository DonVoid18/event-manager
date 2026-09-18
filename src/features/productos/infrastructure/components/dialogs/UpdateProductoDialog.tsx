"use client"

import { CreateProducto, CreateProductoSchema } from "@/features/productos/domain/validations/createProducto"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/infrastructure/shadcn/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/shared/infrastructure/shadcn/components/ui/field"
import { Controller, useForm } from "react-hook-form"

import { Producto } from "@/features/productos/domain/Producto"
import { updateProductoAction } from "@/features/productos/infrastructure/actions/updateProductoAction"
import { Button } from "@/shared/infrastructure/shadcn/components/ui/button"
import { Input } from "@/shared/infrastructure/shadcn/components/ui/input"
import { getPrivateFileUrl } from "@/shared/infrastructure/utils/privateFileUrl"
import { zodResolver } from "@hookform/resolvers/zod"
import { ImageIcon } from "lucide-react"
import { useEffect, useMemo, useState, useTransition } from "react"
import { toast } from "sonner"

interface UpdateProductoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  producto: Producto
  handleUpdateProducto: (producto: Producto) => void
}

const getFormValues = (producto: Producto): CreateProducto => ({
  name: producto.name,
  price: producto.price,
  imageKey: producto.imageKey,
})

export function UpdateProductoDialog({
  open,
  onOpenChange,
  producto,
  handleUpdateProducto,
}: UpdateProductoDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [image, setImage] = useState<File | null>(null)
  const previewUrl = useMemo(() => {
    if (image) {
      return URL.createObjectURL(image)
    }

    return producto.imageKey ? getPrivateFileUrl(producto.imageKey) : null
  }, [image, producto.imageKey])

  const form = useForm<CreateProducto>({
    resolver: zodResolver(CreateProductoSchema),
    defaultValues: getFormValues(producto),
  })

  useEffect(() => {
    if (producto) {
      form.reset(getFormValues(producto))
      setImage(null)
    }
  }, [producto, form])

  const onSubmit = async (data: CreateProducto) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append("name", data.name)
      formData.append("price", String(data.price))

      if (image) {
        formData.append("image", image)
      }

      const result = await updateProductoAction(producto.id, formData)
      if (result.success && result.data) {
        handleUpdateProducto(result.data)
        form.reset()
        setImage(null)
        onOpenChange(false)
        toast.success(result.message)
      } else {
        toast.error(result.error || "Error al actualizar producto")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Actualizar producto
          </DialogTitle>
          <DialogDescription>
            Modifica los datos del producto
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} id="update-producto-form">
          <div className="no-scrollbar max-h-[60vh] overflow-y-auto space-y-2 -mx-2 p-2">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="name">Nombre del producto</FieldLabel>
                  <Input
                    {...field}
                    id="name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Nombre del producto"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="price"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="price">Precio</FieldLabel>
                  <Input
                    {...field}
                    id="price"
                    type="number"
                    step="0.01"
                    aria-invalid={fieldState.invalid}
                    placeholder="0.00"
                    autoComplete="off"
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : Number(e.target.value);
                      field.onChange(val);
                    }}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Field>
              <FieldLabel htmlFor="image">Imagen del producto</FieldLabel>
              <div className="flex items-center gap-3">
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Vista previa"
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="size-6 text-muted-foreground" />
                  )}
                </div>
                <Input
                  id="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => setImage(event.target.files?.[0] ?? null)}
                />
              </div>
            </Field>
          </div>
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" id="update-producto-submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Actualizar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default UpdateProductoDialog
