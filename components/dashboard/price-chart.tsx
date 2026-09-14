"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"

const data = [
  { month: "Abr", proprietario: 290, concorrentes: 315 },
  { month: "Mai", proprietario: 310, concorrentes: 330 },
  { month: "Jun", proprietario: 300, concorrentes: 345 },
  { month: "Jul", proprietario: 340, concorrentes: 360 },
  { month: "Ago", proprietario: 350, concorrentes: 395 },
  { month: "Set", proprietario: 350, concorrentes: 410 },
]

const chartConfig = {
  proprietario: {
    label: "Seu preço",
    color: "var(--chart-1)",
  },
  concorrentes: {
    label: "Média concorrentes (500m)",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function PriceChart() {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base">Preço praticado vs. concorrência</CardTitle>
        <CardDescription>
          Histórico dos últimos 6 meses — diária média em um raio de 500m
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <LineChart accessibilityLayer data={data} margin={{ left: 4, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={48}
              tickFormatter={(value) => `R$${value}`}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent formatter={(value, name) => [
                `R$ ${value}  `,
                chartConfig[name as keyof typeof chartConfig]?.label,
              ]} />}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              dataKey="proprietario"
              type="monotone"
              stroke="var(--color-proprietario)"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              dataKey="concorrentes"
              type="monotone"
              stroke="var(--color-concorrentes)"
              strokeWidth={2.5}
              strokeDasharray="5 4"
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
