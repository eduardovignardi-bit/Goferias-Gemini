import type { Metadata } from "next"
import { PricingView } from "@/components/pricing/pricing-view"

export const metadata: Metadata = {
  title: "Planos e Assinaturas | GoFerias",
  description:
    "Escolha o plano ideal para gerenciar seus aluguéis de temporada nos Ingleses com precificação inteligente por IA.",
}

export default function PlanosPage() {
  return (
    <main className="min-h-screen bg-background">
      <PricingView />
    </main>
  )
}
