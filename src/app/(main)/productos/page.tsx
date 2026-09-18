import ProductoPage from "@/features/productos/infrastructure/pages/ProductoPage"
import { prisma } from "@/shared/infrastructure/libs/prisma"

export const revalidate = 0

const page = async () => {
  const products = await prisma.product.findMany({
    orderBy: {
      createdAt: "desc",
    },
  })

  // Map database Product to domain Producto
  const initialProductos = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    imageKey: p.imageKey,
  }))

  return <ProductoPage productos={initialProductos} />
}

export default page
