"use client"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/infrastructure/shadcn/components/ui/dialog"

import { Producto } from "@/features/productos/domain/Producto"
import { Button } from "@/shared/infrastructure/shadcn/components/ui/button"
import { useTransition } from "react"
import { toast } from "sonner"
import { deleteProductoAction } from "../../actions/deleteProductoAction"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  producto: Producto
  handleDeleteProducto: (deletedProducto: Producto) => void
}

export function DeleteProductoDialog({
  open,
  onOpenChange,
  producto,
  handleDeleteProducto,
}: Props) {
  const [isDeleting, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProductoAction(producto.id)
      if (result.success) {
        toast.success(result.message)
        handleDeleteProducto(producto)
        onOpenChange(false)
      } else {
        toast.error(result.error || "Error al eliminar el producto")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Eliminar producto</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que deseas eliminar el producto &quot;{producto.name}&quot;?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteProductoDialog
