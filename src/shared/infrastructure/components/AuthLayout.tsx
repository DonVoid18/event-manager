import { CheckCircle2, ScanLine, Send, UserPlus } from "lucide-react";

import { BrandMark } from "@/shared/infrastructure/components/BrandMark";
import { MAIN_ROUTE } from "@/shared/infrastructure/utils/routes";

interface AuthLayoutProps {
  children: React.ReactNode;
}

const FEATURES = [
  { icon: UserPlus, title: "Registro de asistentes", text: "Eventos gratuitos y de pago, sin duplicados." },
  { icon: Send, title: "Invitaciones digitales", text: "Envío por correo con código QR y seguimiento." },
  { icon: ScanLine, title: "Check-in en segundos", text: "Búsqueda instantánea o lectura del código QR." },
];

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 bg-card p-6 md:p-10">
        <div className="flex justify-center md:justify-start">
          <a href={MAIN_ROUTE}>
            <BrandMark />
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">{children}</div>
        </div>
        <p className="text-center text-xs text-muted-foreground md:text-left">
          © {new Date().getFullYear()} TUMITECH S.A.C. · Huánuco, Perú
        </p>
      </div>
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-sky-700 via-sky-800 to-slate-900 lg:flex lg:items-center lg:justify-center">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative max-w-md space-y-8 p-10 text-white">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20">
              <CheckCircle2 className="size-3.5" /> Plataforma de gestión de eventos
            </span>
            <h2 className="text-3xl font-bold leading-tight">
              Registro, invitaciones y control de ingreso en un solo lugar.
            </h2>
          </div>
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-white/70">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
