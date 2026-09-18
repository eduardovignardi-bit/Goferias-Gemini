"use client"

import { useState } from "react"
import { Lock, Plug, RefreshCw } from "lucide-react"
import { PaywallModal } from "@/components/pricing/paywall-modal"

// Simula o plano do usuário logado. Trocar para "gopro" libera os canais.
const currentPlan: "goflats" | "gopro" = "goflats"

const channels = [
  {
    name: "Airbnb",
    description: "Sincronize preços e disponibilidade automaticamente.",
    color: "bg-rose-500",
    initial: "A",
  },
  {
    name: "Booking.com",
    description: "Espelhe suas diárias otimizadas por IA em tempo real.",
    color: "bg-blue-600",
    initial: "B",
  },
]

export function SettingsView() {
  const [paywallOpen, setPaywallOpen] = useState(false)
  const isPro = currentPlan === "gopro"

  function handleConnect() {
    if (!isPro) {
      setPaywallOpen(true)
      return
    }
    // Fluxo real de conexão OAuth entraria aqui.
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie suas integrações e canais de distribuição.
        </p>
      </header>

      <section aria-labelledby="canais-title">
        <div className="mb-4 flex items-center gap-2">
          <Plug className="size-4 text-primary" />
          <h2 id="canais-title" className="text-sm font-semibold">
            Configurações de Canais
          </h2>
          {!isPro && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              <Lock className="size-3" />
              GoPro
            </span>
          )}
        </div>

        <div className="space-y-3">
          {channels.map((channel) => (
            <div
              key={channel.name}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div
                className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${channel.color} text-lg font-bold text-white`}
              >
                {channel.initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{channel.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {channel.description}
                </p>
              </div>
              <button
                type="button"
                onClick={handleConnect}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:brightness-105 active:scale-[0.98]"
              >
                {isPro ? (
                  <>
                    <RefreshCw className="size-3.5" />
                    Conectar
                  </>
                ) : (
                  <>
                    <Lock className="size-3.5" />
                    Conectar
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  )
}
