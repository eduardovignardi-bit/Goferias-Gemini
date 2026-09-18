export type BillingCycle = "monthly" | "annual"

export interface Plan {
  id: string
  name: string
  tagline: string
  description: string
  monthlyPrice: number
  features: string[]
  cta: string
  highlighted?: boolean
  current?: boolean
}

export const plans: Plan[] = [
  {
    id: "goflats",
    name: "GoFlats",
    tagline: "Gratuito",
    description:
      "Para proprietários que estão começando e querem monitorar o mercado.",
    monthlyPrice: 0,
    features: [
      "Cadastro de até 2 imóveis",
      "Visualização de sugestões de IA no painel",
      "Gráfico de histórico de preços do raio de 500m nos Ingleses",
    ],
    cta: "Plano Atual",
    current: true,
  },
  {
    id: "gopro",
    name: "GoPro",
    tagline: "Premium",
    description:
      "Para gestores profissionais que querem escala e automação total.",
    monthlyPrice: 99,
    features: [
      "Imóveis ilimitados",
      "Sincronização automática de preços por IA com Airbnb e Booking.com (sem ajuste manual)",
      "Relatórios avançados de demanda local",
      "Suporte prioritário via WhatsApp",
    ],
    cta: "Assinar Agora",
    highlighted: true,
  },
]

export const ANNUAL_DISCOUNT = 0.2

export function getPriceForCycle(monthlyPrice: number, cycle: BillingCycle) {
  if (cycle === "monthly") return monthlyPrice
  return Math.round(monthlyPrice * (1 - ANNUAL_DISCOUNT))
}
