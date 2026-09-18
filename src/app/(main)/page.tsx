import { Package, User as UserIcon } from "lucide-react";
import Link from "next/link";

import { auth } from "@/shared/infrastructure/libs/auth";
import { prisma } from "@/shared/infrastructure/libs/prisma";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/infrastructure/shadcn/components/ui/card";
import { Button } from "@/shared/infrastructure/shadcn/components/ui/button";

export const revalidate = 0;

export default async function Home() {
  const session = await auth();
  const totalProductos = await prisma.product.count();
  const firstName = session?.user.name?.split(" ")[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {firstName ? `Hola, ${firstName}` : "Bienvenido"}
        </h1>
        <p className="text-muted-foreground text-sm">
          Este es el panel principal de tu proyecto.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Productos registrados</CardDescription>
            <CardTitle className="text-3xl">{totalProductos}</CardTitle>
            <CardAction>
              <Package className="size-5 text-muted-foreground" />
            </CardAction>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productos</CardTitle>
            <CardDescription>
              Administra el catálogo: crea, edita y elimina productos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/productos">
                <Package className="size-4" />
                Ir a Productos
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mi perfil</CardTitle>
            <CardDescription>
              Actualiza tu información personal y tu contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/perfil">
                <UserIcon className="size-4" />
                Ir a Perfil
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
