import UsuarioPage from "@/features/usuarios/infrastructure/pages/UsuarioPage"
import { auth } from "@/shared/infrastructure/libs/auth"
import { prisma } from "@/shared/infrastructure/libs/prisma"
import { MAIN_ROUTE } from "@/shared/infrastructure/utils/routes"
import { redirect } from "next/navigation"

export const revalidate = 0

const page = async () => {
  const session = await auth()

  if (!session || session.user.role !== "ADMIN") {
    redirect(MAIN_ROUTE)
  }

  const usuarios = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  })

  return <UsuarioPage usuarios={usuarios} currentUserId={session.user.id} />
}

export default page
