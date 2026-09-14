import { Sidebar } from "@/components/dashboard/sidebar"
import { MetricCards } from "@/components/dashboard/metric-cards"
import { AiPricingCard } from "@/components/dashboard/ai-pricing-card"
import { PriceChart } from "@/components/dashboard/price-chart"

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-x-hidden">
        <header className="flex flex-col gap-1 border-b border-border/60 bg-card/50 px-6 py-5 sm:px-8">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Painel do Proprietário
          </h1>
          <p className="text-sm text-muted-foreground">
            Bem-vindo de volta! Aqui está o desempenho dos seus imóveis hoje.
          </p>
        </header>

        <div className="flex flex-col gap-6 p-6 sm:p-8">
          <MetricCards />
          <AiPricingCard />
          <PriceChart />
        </div>
      </main>
    </div>
  )
}
