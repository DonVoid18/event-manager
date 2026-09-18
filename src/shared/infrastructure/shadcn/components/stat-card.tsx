import { Card, CardContent } from "@/shared/infrastructure/shadcn/components/ui/card"
import { cn } from "@/shared/infrastructure/shadcn/lib/utils"

type StatCardColor = "primary" | "info" | "success" | "warning"

const COLOR_CLASSES: Record<StatCardColor, string> = {
  primary: "bg-primary/10 text-primary",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
}

interface StatCardProps {
  label: string
  value: React.ReactNode
  icon: React.ReactNode
  color?: StatCardColor
  className?: string
}

export function StatCard({ label, value, icon, color = "primary", className }: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="flex items-center gap-4">
        <div className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", COLOR_CLASSES[color])}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold leading-tight break-words">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default StatCard
