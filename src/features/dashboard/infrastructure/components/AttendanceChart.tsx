"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/infrastructure/shadcn/components/ui/chart"

export interface AttendancePoint {
  code: string
  name: string
  registrados: number
  asistentes: number
}

const chartConfig = {
  registrados: { label: "Registrados", color: "var(--chart-1)" },
  asistentes: { label: "Asistieron", color: "var(--chart-2)" },
} satisfies ChartConfig

export function AttendanceChart({ data, height = 300 }: { data: AttendancePoint[]; height?: number }) {
  return (
    <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
      <BarChart data={data} margin={{ left: -12, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="code" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} width={40} fontSize={11} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)" }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ""}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="registrados" fill="var(--color-registrados)" radius={[6, 6, 0, 0]} />
        <Bar dataKey="asistentes" fill="var(--color-asistentes)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

export default AttendanceChart
