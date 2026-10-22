import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  MailCheck,
  ScanLine,
  Send,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";

import { AttendanceChart } from "@/features/dashboard/infrastructure/components/AttendanceChart";
import { ProgressBar, StatCard } from "@/shared/infrastructure/components/StatCard";
import { auth } from "@/shared/infrastructure/libs/auth";
import { prisma } from "@/shared/infrastructure/libs/prisma";
import { Badge } from "@/shared/infrastructure/shadcn/components/ui/badge";
import { Button } from "@/shared/infrastructure/shadcn/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/infrastructure/shadcn/components/ui/card";

export const revalidate = 0;

const formatNumber = (value: number) => value.toLocaleString("es-PE");
const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

export default async function Home() {
  const session = await auth();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalEventos,
    totalAsistentes,
    invitacionesEnviadas,
    invitacionesConfirmadas,
    totalCheckins,
    totalIncidencias,
    proximos,
    recientes,
    ultimosIngresos,
  ] = await Promise.all([
    prisma.event.count(),
    prisma.attendee.count(),
    prisma.invitation.count({ where: { status: { in: ["ENVIADA", "CONFIRMADA"] } } }),
    prisma.invitation.count({ where: { status: "CONFIRMADA" } }),
    prisma.checkIn.count(),
    prisma.incident.count(),
    prisma.event.findMany({
      where: { eventDate: { gte: startOfToday } },
      orderBy: { eventDate: "asc" },
      take: 4,
      include: { _count: { select: { attendees: true } } },
    }),
    prisma.event.findMany({
      where: { eventDate: { lt: startOfToday } },
      orderBy: { eventDate: "desc" },
      take: 10,
      select: {
        code: true,
        name: true,
        _count: { select: { attendees: true } },
        attendees: { select: { checkIn: { select: { id: true } } } },
      },
    }),
    prisma.checkIn.findMany({
      orderBy: { checkedInAt: "desc" },
      take: 6,
      include: {
        attendee: {
          select: { firstName: true, lastName: true, event: { select: { name: true } } },
        },
      },
    }),
  ]);

  const firstName = session?.user.name?.split(" ")[0];
  const tasaAsistencia = totalAsistentes ? totalCheckins / totalAsistentes : 0;
  const tasaInvitacion = totalAsistentes ? invitacionesEnviadas / totalAsistentes : 0;
  const tasaConfirmacion = invitacionesEnviadas ? invitacionesConfirmadas / invitacionesEnviadas : 0;

  const chartData = recientes
    .map((evento) => ({
      code: evento.code.replace("EVT-", ""),
      name: evento.name,
      registrados: evento._count.attendees,
      asistentes: evento.attendees.filter((a) => a.checkIn).length,
    }))
    .reverse();

  const procesos = [
    {
      step: "01",
      title: "Registro de asistentes",
      description: "Inscripción a eventos gratuitos y de pago con validación de datos, control de duplicados y comprobantes.",
      metric: `${formatNumber(totalAsistentes)} asistentes registrados`,
      progressLabel: "Promedio por evento",
      progressValue: totalEventos ? `${Math.round(totalAsistentes / totalEventos)} personas` : "—",
      href: "/eventos",
      cta: "Gestionar eventos",
      icon: UserPlus,
      accent: "from-teal-700 to-cyan-800",
    },
    {
      step: "02",
      title: "Invitaciones y seguimiento",
      description: "Envío de invitaciones por correo con código QR, estados en tiempo real e historial de cambios.",
      metric: `${formatNumber(invitacionesEnviadas)} invitaciones enviadas`,
      progressLabel: "Confirmadas",
      progressValue: percent(tasaConfirmacion),
      progress: tasaConfirmacion,
      href: "/eventos",
      cta: "Revisar invitaciones",
      icon: Send,
      accent: "from-emerald-700 to-teal-800",
    },
    {
      step: "03",
      title: "Check-in y asistencia",
      description: "Ingreso por búsqueda o lectura de QR, bloqueo de ingresos duplicados y registro de incidencias.",
      metric: `${percent(tasaAsistencia)} de asistencia registrada`,
      progressLabel: "Check-ins",
      progressValue: formatNumber(totalCheckins),
      progress: tasaAsistencia,
      href: "/checkin",
      cta: "Abrir control de acceso",
      icon: ScanLine,
      accent: "from-slate-700 to-slate-900",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Bienvenida */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#123745] via-[#0d5360] to-[#102b3a] p-8 text-white shadow-[0_24px_55px_-30px_rgba(12,55,69,0.75)] md:p-10">
        <div className="absolute -right-16 -top-24 size-80 rounded-full bg-teal-200/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
            backgroundSize: "26px 26px",
          }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20">
              <Sparkles className="size-3.5" /> Centro de operaciones
            </span>
            <h1 className="text-3xl font-bold leading-tight md:text-4xl">
              {firstName ? `Hola, ${firstName}.` : "Bienvenido."} Tus eventos, bajo control.
            </h1>
            <p className="text-base text-white/75">
              Organiza registros, invitaciones y accesos desde un solo lugar, con información clara para tomar decisiones rápidas.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-12 bg-white px-6 text-base text-teal-900 hover:bg-white/90">
              <Link href="/eventos?nuevo=1">
                <CalendarPlus className="size-5" />
                Crear evento
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-white/30 bg-white/10 px-6 text-base text-white hover:bg-white/20 hover:text-white"
            >
              <Link href="/checkin">
                <ScanLine className="size-5" />
                Abrir check-in
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Indicadores */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Eventos gestionados" value={formatNumber(totalEventos)} icon={CalendarDays} tone="sky"
          hint={`${proximos.length} próximo(s) en agenda`} />
        <StatCard label="Asistentes registrados" value={formatNumber(totalAsistentes)} icon={Users} tone="violet"
          hint={`${formatNumber(totalIncidencias)} incidencia(s) registradas`} />
        <StatCard label="Invitaciones enviadas" value={formatNumber(invitacionesEnviadas)} icon={MailCheck} tone="emerald"
          progress={tasaInvitacion} hint={`${percent(tasaInvitacion)} de los asistentes`} />
        <StatCard label="Asistencia" value={percent(tasaAsistencia)} icon={CheckCircle2} tone="amber"
          progress={tasaAsistencia} hint={`${formatNumber(totalCheckins)} check-ins realizados`} />
      </section>

      {/* Procesos principales */}
      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">TUMITECH S.A.C.</p>
          <h2 className="text-xl font-bold">Procesos principales</h2>
          <p className="text-sm text-muted-foreground">Los tres procesos que atiende el sistema, con su indicador actual.</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {procesos.map((p) => (
            <Card key={p.step} className="group gap-0 overflow-hidden p-0 shadow-sm transition-shadow hover:shadow-md">
              <div className={`flex items-center justify-between bg-gradient-to-r ${p.accent} p-5 text-white`}>
                <div className="flex size-12 items-center justify-center rounded-xl bg-white/15">
                  <p.icon className="size-6" />
                </div>
                <span className="text-4xl font-bold text-white/30">{p.step}</span>
              </div>
              <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{p.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                </div>
                <div className="mt-auto space-y-2 rounded-xl bg-muted/60 p-4">
                  <p className="text-sm font-semibold">{p.metric}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{p.progressLabel}</span>
                    <span className="font-medium text-foreground">{p.progressValue}</span>
                  </div>
                  {typeof p.progress === "number" && <ProgressBar value={p.progress} />}
                </div>
                <Button asChild size="lg" variant="outline" className="h-11 w-full justify-between text-base">
                  <Link href={p.href}>
                    {p.cta}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Asistencia y agenda */}
      <section className="grid gap-5 xl:grid-cols-3">
        <Card className="shadow-sm xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Registrados vs. asistentes</CardTitle>
            <CardDescription>Últimos {chartData.length} eventos realizados</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length ? (
              <AttendanceChart data={chartData} />
            ) : (
              <p className="py-16 text-center text-sm text-muted-foreground">Aún no hay eventos realizados.</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Próximos eventos</CardTitle>
            <CardDescription>Agenda de los siguientes días</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {proximos.length ? (
              proximos.map((evento) => {
                const ocupacion = evento.capacity ? evento._count.attendees / evento.capacity : 0;
                return (
                  <Link
                    key={evento.id}
                    href={`/eventos/${evento.id}`}
                    className="block space-y-2 rounded-xl border p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold leading-snug">{evento.name}</p>
                      <Badge variant={evento.type === "PAGO" ? "default" : "secondary"}>
                        {evento.type === "PAGO" ? "De pago" : "Gratuito"}
                      </Badge>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5" />
                      {format(evento.eventDate, "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                    </p>
                    <div className="flex items-center gap-3">
                      <ProgressBar value={ocupacion} />
                      <span className="shrink-0 text-xs font-medium tabular-nums">
                        {evento._count.attendees}/{evento.capacity}
                      </span>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">No hay eventos programados.</p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Actividad reciente */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Últimos ingresos registrados</CardTitle>
          <CardDescription>Actividad reciente del control de acceso</CardDescription>
        </CardHeader>
        <CardContent>
          {ultimosIngresos.length ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {ultimosIngresos.map((ingreso) => (
                <div key={ingreso.id} className="flex items-center gap-3 rounded-xl border p-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700">
                    {ingreso.attendee.firstName[0]}
                    {ingreso.attendee.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {ingreso.attendee.firstName} {ingreso.attendee.lastName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{ingreso.attendee.event.name}</p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {formatDistanceToNow(ingreso.checkedInAt, { locale: es, addSuffix: true })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">Todavía no se registran ingresos.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
