"use client"

import { Producto } from "@/features/productos/domain/Producto"
import { CreateProductoDialog } from "../components/dialogs/CreateProductoDialog"
import { DeleteProductoDialog } from "../components/dialogs/DeleteProductoDialog"
import { UpdateProductoDialog } from "../components/dialogs/UpdateProductoDialog"
import { ProductoTable } from "../components/tables/ProductoTable"
import { useState } from "react"

interface ProductoPageProps {
  productos: Producto[]
}

type DialogState =
  | { type: "create" }
  | { type: "update"; producto: Producto }
  | { type: "delete"; producto: Producto }
  | null

export function ProductoPage({ productos: initialProductos }: ProductoPageProps) {
  const [dialog, setDialog] = useState<DialogState>(null)
  const [productos, setProductos] = useState<Producto[]>(initialProductos)

  const handleAddProducto = (newProducto: Producto) => {
    setProductos((prev) => [newProducto, ...prev])
  }

  const handleUpdateProducto = (updatedProducto: Producto) => {
    setProductos((prev) =>
      prev.map((item) => (item.id === updatedProducto.id ? updatedProducto : item))
    )
  }

  const handleDeleteProducto = (deletedProducto: Producto) => {
    setProductos((prev) => prev.filter((item) => item.id !== deletedProducto.id))
  }

  return (
    <div className="space-y-4">
      <ProductoTable
        data={productos}
        onEdit={(producto) => setDialog({ type: "update", producto })}
        onDelete={(producto) => setDialog({ type: "delete", producto })}
        onOpenAddDialog={() => setDialog({ type: "create" })}
      />
      {
        dialog && (
          <>
            {dialog.type === "create" && (
              <CreateProductoDialog
                open
                onOpenChange={(open) => !open && setDialog(null)}
                handleAddProducto={handleAddProducto}
              />
            )}
            {dialog.type === "update" && (
              <UpdateProductoDialog
                open
                onOpenChange={(open) => !open && setDialog(null)}
                producto={dialog.producto}
                handleUpdateProducto={handleUpdateProducto}
              />
            )}
            {dialog.type === "delete" && (
              <DeleteProductoDialog
                open
                onOpenChange={(open) => !open && setDialog(null)}
                producto={dialog.producto}
                handleDeleteProducto={handleDeleteProducto}
              />
            )}
          </>
        )
      }
    </div>
  )
}

export default ProductoPage