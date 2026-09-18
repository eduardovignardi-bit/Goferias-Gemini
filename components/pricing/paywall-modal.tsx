"use client"

import { useRouter } from "next/navigation"
import { Rocket, X, Check, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaywallModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
}

const highlights = [
  "Sincronização automática de preços com Airbnb e Booking",
  "Imóveis ilimitados e relatórios de demanda local",
  "Suporte prioritário via WhatsApp",
]

export function PaywallModal({
  open,
  onClose,
  title = "Recurso Exclusivo do Plano GoPro 🚀",
  description = "Automatize seus preços nas grandes plataformas em tempo real e evite overbooking. Atualize seu plano agora e economize horas de trabalho manual.",
}: PaywallModalProps) {
  const router = useRouter()

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-background/70 backdrop-blur-md"
      />

      <div
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl",
          "animate-in fade-in zoom-in-95 duration-200",
        )}
      >
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <div className="bg-gradient-to-br from-primary to-primary/70 px-6 pb-8 pt-7 text-primary-foreground">
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <Rocket className="size-6" />
          </div>
          <h2 id="paywall-title" className="text-xl font-bold leading-tight text-balance">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-primary-foreground/85">
            {description}
          </p>
        </div>

        <div className="space-y-4 px-6 py-6">
          <ul className="space-y-2.5">
            {highlights.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="size-3" />
                </span>
                <span className="text-foreground/80">{item}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => router.push("/planos")}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:brightness-105 active:scale-[0.98]"
          >
            Fazer upgrade para o GoPro
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Lock className="size-3" />
            Continuar no plano gratuito
          </button>
        </div>
      </div>
    </div>
  )
}
