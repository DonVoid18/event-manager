import type { LucideIcon } from "lucide-react";

import { Card } from "@/shared/infrastructure/shadcn/components/ui/card";
import { cn } from "@/shared/infrastructure/shadcn/lib/utils";

export type StatTone = "sky" | "emerald" | "amber" | "violet" | "slate" | "rose";

const TONES: Record<StatTone, { tile: string; bar: string }> = {
  sky: { tile: "bg-sky-50 text-sky-700 ring-sky-100", bar: "bg-sky-600" },
  emerald: { tile: "bg-emerald-50 text-emerald-700 ring-emerald-100", bar: "bg-emerald-600" },
  amber: { tile: "bg-amber-50 text-amber-700 ring-amber-100", bar: "bg-amber-500" },
  violet: { tile: "bg-violet-50 text-violet-700 ring-violet-100", bar: "bg-violet-600" },
  slate: { tile: "bg-slate-100 text-slate-700 ring-slate-200", bar: "bg-slate-600" },
  rose: { tile: "bg-rose-50 text-rose-700 ring-rose-100", bar: "bg-rose-500" },
};

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  hint?: React.ReactNode;
  tone?: StatTone;
  /** Valor entre 0 y 1 para mostrar una barra de avance. */
  progress?: number;
  className?: string;
}

export function StatCard({ label, value, icon: Icon, hint, tone = "sky", progress, className }: StatCardProps) {
  const colors = TONES[tone];
  return (
    <Card className={cn("gap-0 p-5 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tracking-tight tabular-nums">{value}</p>
        </div>
        <div className={cn("flex size-12 shrink-0 items-center justify-center rounded-xl ring-1", colors.tile)}>
          <Icon className="size-6" />
        </div>
      </div>
      {typeof progress === "number" && (
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", colors.bar)}
            style={{ width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }}
          />
        </div>
      )}
      {hint && <p className="mt-3 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

export function ProgressBar({ value, tone = "sky", className }: { value: number; tone?: StatTone; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full", TONES[tone].bar)}
        style={{ width: `${Math.min(Math.max(value, 0), 1) * 100}%` }}
      />
    </div>
  );
}

export default StatCard;
