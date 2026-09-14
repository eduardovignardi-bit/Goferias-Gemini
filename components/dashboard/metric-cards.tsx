import { TrendingUp, TrendingDown, Percent, Wallet, Home } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const metrics = [
  {
    label: "Taxa de Ocupação Atual",
    value: "87%",
    change: "+4,2%",
    trend: "up" as const,
    icon: Percent,
    hint: "vs. mês anterior",
  },
  {
    label: "Receita do Mês",
    value: "R$ 38.420",
    change: "+12,8%",
    trend: "up" as const,
    icon: Wallet,
    hint: "vs. mês anterior",
  },
  {
    label: "Imóveis Ativos",
    value: "6",
    change: "-1",
    trend: "down" as const,
    icon: Home,
    hint: "1 em manutenção",
  },
]

export function MetricCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric) => {
        const Icon = metric.icon
        const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown
        return (
          <Card key={metric.label} className="border-border/60">
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {metric.label}
                </span>
                <div className="flex size-9 items-center justify-center rounded-lg bg-accent text-primary">
                  <Icon className="size-4.5" />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-semibold tracking-tight text-foreground">
                  {metric.value}
                </span>
                <span
                  className={cn(
                    "mb-1 flex items-center gap-0.5 text-xs font-semibold",
                    metric.trend === "up" ? "text-emerald-600" : "text-red-500",
                  )}
                >
                  <TrendIcon className="size-3.5" />
                  {metric.change}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{metric.hint}</span>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
