"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, Sparkles, ArrowLeft, Loader2, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  plans,
  getPriceForCycle,
  ANNUAL_DISCOUNT,
  type BillingCycle,
} from "./plans-data"

export function PricingView() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly")
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null)

  function handleSubscribe(planId: string) {
    setCheckoutPlan(planId)
    // Simula a abertura de um checkout externo (Stripe / Asaas)
    setTimeout(() => setCheckoutPlan(null), 2600)
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar ao painel
      </Link>

      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" />
          Planos e Assinaturas
        </span>
        <h1 className="mt-4 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Escale seus aluguéis de temporada com IA
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
          Comece grátis e faça upgrade quando quiser automatizar seus preços nos
          Ingleses. Sem fidelidade, cancele quando quiser.
        </p>
      </div>

      {/* Alternador de faturamento */}
      <div className="mt-8 flex items-center justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 p-1">
          <button
            type="button"
            onClick={() => setCycle("monthly")}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              cycle === "monthly"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => setCycle("annual")}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all",
              cycle === "annual"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Anual
            <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[11px] font-bold text-primary">
              -{Math.round(ANNUAL_DISCOUNT * 100)}%
            </span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="mx-auto mt-8 grid max-w-3xl gap-6 md:grid-cols-2">
        {plans.map((plan) => {
          const price = getPriceForCycle(plan.monthlyPrice, cycle)
          const isFree = plan.monthlyPrice === 0
          const isLoading = checkoutPlan === plan.id

          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-shadow",
                plan.highlighted
                  ? "border-primary/50 shadow-lg ring-1 ring-primary/20"
                  : "border-border",
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
                  <Sparkles className="size-3" />
                  Mais Popular
                </span>
              )}

              <div className="flex items-baseline gap-2">
                <h2 className="text-lg font-bold">{plan.name}</h2>
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[11px] font-semibold",
                    plan.highlighted
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {plan.tagline}
                </span>
              </div>

              <p className="mt-2 min-h-10 text-sm leading-relaxed text-muted-foreground">
                {plan.description}
              </p>

              <div className="mt-5 flex items-end gap-1">
                <span className="text-4xl font-bold tracking-tight">
                  R$ {price}
                </span>
                <span className="mb-1 text-sm text-muted-foreground">/mês</span>
              </div>
              {cycle === "annual" && !isFree && (
                <p className="mt-1 text-xs text-primary">
                  Cobrado R$ {price * 12} por ano
                </p>
              )}
              {(cycle === "monthly" || isFree) && (
                <p className="mt-1 text-xs text-transparent">.</p>
              )}

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <span
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                        plan.highlighted
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-foreground/70",
                      )}
                    >
                      <Check className="size-3" />
                    </span>
                    <span className="text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7">
                {plan.current ? (
                  <button
                    type="button"
                    disabled
                    className="w-full cursor-default rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm font-semibold text-muted-foreground"
                  >
                    {plan.cta}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isLoading}
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold shadow-sm transition-all active:scale-[0.98] disabled:opacity-90",
                      "bg-primary text-primary-foreground hover:brightness-105",
                    )}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Abrindo checkout seguro...
                      </>
                    ) : (
                      plan.cta
                    )}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5" />
        Pagamento processado com segurança via Stripe. Cancele quando quiser.
      </p>
    </div>
  )
}
