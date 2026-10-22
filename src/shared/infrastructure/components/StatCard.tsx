import type { LucideIcon } from "lucide-react";

import { Card } from "@/shared/infrastructure/shadcn/components/ui/card";
import { cn } from "@/shared/infrastructure/shadcn/lib/utils";

export type StatTone = "sky" | "emerald" | "amber" | "violet" | "slate" | "rose";

const TONES: Record<StatTone, { tile: string; bar: string }> = {
  sky: { tile: "bg-teal-50 text-teal-800 ring-teal-100 dark:bg-teal-400/10 dark:text-teal-200 dark:ring-teal-400/20", bar: "bg-teal-700 dark:bg-teal-400" },
  emerald: { tile: "bg-emerald-50 text-emerald-800 ring-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20", bar: "bg-emerald-700 dark:bg-emerald-400" },
  amber: { tile: "bg-amber-50 text-amber-800 ring-amber-100 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20", bar: "bg-amber-600 dark:bg-amber-400" },
  violet: { tile: "bg-indigo-50 text-indigo-800 ring-indigo-100 dark:bg-indigo-400/10 dark:text-indigo-200 dark:ring-indigo-400/20", bar: "bg-indigo-600 dark:bg-indigo-400" },
  slate: { tile: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-300/10 dark:text-slate-200 dark:ring-slate-300/20", bar: "bg-slate-600 dark:bg-slate-300" },
  rose: { tile: "bg-rose-50 text-rose-800 ring-rose-100 dark:bg-rose-400/10 dark:text-rose-200 dark:ring-rose-400/20", bar: "bg-rose-600 dark:bg-rose-400" },
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
    <Card className={cn("gap-0 border border-border/70 p-5 shadow-[0_10px_30px_-22px_rgba(18,43,56,0.28)]", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold tracking-tight tabular-nums text-foreground">{value}</p>
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
