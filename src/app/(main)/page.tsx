import { CalendarDays, FileBarChart, Package, ScanLine, User as UserIcon } from "lucide-react";
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
  const [totalEventos, totalAsistentes, totalCheckins] = await Promise.all([
    prisma.event.count(),
    prisma.attendee.count(),
    prisma.checkIn.count(),
  ]);
  const firstName = session?.user.name?.split(" ")[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {firstName ? `Hola, ${firstName}` : "Bienvenido"}
        </h1>
        <p className="text-muted-foreground text-sm">
          Panel principal de gestión de eventos de TUMITECH.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Eventos registrados</CardDescription>
            <CardTitle className="text-3xl">{totalEventos}</CardTitle>
            <CardAction>
              <CalendarDays className="size-5 text-muted-foreground" />
            </CardAction>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Asistentes registrados</CardDescription>
            <CardTitle className="text-3xl">{totalAsistentes}</CardTitle>
            <CardAction>
              <UserIcon className="size-5 text-muted-foreground" />
            </CardAction>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Check-ins realizados</CardDescription>
            <CardTitle className="text-3xl">{totalCheckins}</CardTitle>
            <CardAction>
              <ScanLine className="size-5 text-muted-foreground" />
            </CardAction>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Eventos</CardTitle>
            <CardDescription>
              Registra eventos, gestiona asistentes e invitaciones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/eventos">
                <CalendarDays className="size-4" />
                Ir a Eventos
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Check-in</CardTitle>
            <CardDescription>
              Registra el ingreso de los asistentes el día del evento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/checkin">
                <ScanLine className="size-4" />
                Ir a Check-in
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reportes</CardTitle>
            <CardDescription>
              Consulta y exporta el registro, invitaciones y check-in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/reportes">
                <FileBarChart className="size-4" />
                Ir a Reportes
              </Link>
            </Button>
          </CardContent>
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
