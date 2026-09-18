import { CalendarClock } from "lucide-react";

import { MAIN_ROUTE } from "@/shared/infrastructure/utils/routes";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href={MAIN_ROUTE} className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-indigo-700 text-primary-foreground">
              <CalendarClock className="size-4" />
            </div>
            <span className="font-semibold text-lg">TUMITECH</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 lg:flex lg:items-center lg:justify-center dark:from-violet-950 dark:via-indigo-950 dark:to-blue-950">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative flex flex-col items-center gap-4 text-center">
          <CalendarClock className="size-40 text-white/15" strokeWidth={1} />
          <div className="text-white/90">
            <p className="text-2xl font-semibold">TUMITECH</p>
            <p className="text-sm text-white/60">Sistema de gestión de eventos</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
