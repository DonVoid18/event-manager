import { CalendarDays, FileBarChart, Package, ScanLine, User as UserIcon } from "lucide-react";
import Link from "next/link";

import { auth } from "@/shared/infrastructure/libs/auth";
import { prisma } from "@/shared/infrastructure/libs/prisma";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/infrastructure/shadcn/components/ui/card";
import { StatCard } from "@/shared/infrastructure/shadcn/components/stat-card";
import { Button } from "@/shared/infrastructure/shadcn/components/ui/button";
import { cn } from "@/shared/infrastructure/shadcn/lib/utils";

export const revalidate = 0;

const quickLinks = [
  {
    title: "Eventos",
    description: "Registra eventos, gestiona asistentes e invitaciones.",
    href: "/eventos",
    icon: CalendarDays,
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Check-in",
    description: "Registra el ingreso de los asistentes el día del evento.",
    href: "/checkin",
    icon: ScanLine,
    color: "bg-success/10 text-success",
  },
  {
    title: "Reportes",
    description: "Consulta y exporta el registro, invitaciones y check-in.",
    href: "/reportes",
    icon: FileBarChart,
    color: "bg-warning/10 text-warning",
  },
  {
    title: "Productos",
    description: "Administra el catálogo: crea, edita y elimina productos.",
    href: "/productos",
    icon: Package,
    color: "bg-info/10 text-info",
  },
  {
    title: "Mi perfil",
    description: "Actualiza tu información personal y tu contraseña.",
    href: "/perfil",
    icon: UserIcon,
    color: "bg-muted text-muted-foreground",
  },
] as const;

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

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Eventos registrados" value={totalEventos} icon={<CalendarDays className="size-5" />} color="primary" />
        <StatCard label="Asistentes registrados" value={totalAsistentes} icon={<UserIcon className="size-5" />} color="info" />
        <StatCard label="Check-ins realizados" value={totalCheckins} icon={<ScanLine className="size-5" />} color="success" />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Accesos rápidos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Card key={link.href}>
              <CardHeader>
                <div className={cn("mb-2 flex size-10 items-center justify-center rounded-lg", link.color)}>
                  <link.icon className="size-5" />
                </div>
                <CardTitle>{link.title}</CardTitle>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href={link.href}>Ir a {link.title}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
