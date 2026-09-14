import type { Metadata } from "next"
import { MarketplaceView } from "@/components/marketplace/marketplace-view"

export const metadata: Metadata = {
  title: "Marketplace | GoFerias — Aluguel de temporada nos Ingleses",
  description:
    "Encontre imóveis para aluguel de temporada na Praia dos Ingleses, Florianópolis. Anúncios diretos e importados de Airbnb e Booking em um só lugar.",
}

export default function MarketplacePage() {
  return <MarketplaceView />
}
