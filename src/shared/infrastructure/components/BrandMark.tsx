import { CalendarCheck2 } from "lucide-react";

import { cn } from "@/shared/infrastructure/shadcn/lib/utils";

interface BrandMarkProps {
  className?: string;
  /** Muestra solo el ícono, sin el nombre de la empresa. */
  compact?: boolean;
  /** Variante de color para fondos oscuros (barra lateral) o claros. */
  tone?: "dark" | "light";
}

export function BrandMark({ className, compact = false, tone = "light" }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-md shadow-sky-900/20">
        <CalendarCheck2 className="size-5" />
      </div>
      {!compact && (
        <div className="grid leading-tight">
          <span
            className={cn(
              "text-base font-bold tracking-wide",
              tone === "dark" ? "text-white" : "text-foreground"
            )}
          >
            TUMITECH
          </span>
          <span
            className={cn(
              "text-xs",
              tone === "dark" ? "text-sidebar-foreground/70" : "text-muted-foreground"
            )}
          >
            Gestión de eventos
          </span>
        </div>
      )}
    </div>
  );
}

export default BrandMark;
