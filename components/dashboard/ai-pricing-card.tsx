"use client"

import { useState } from "react"
import { Sparkles, MapPin, ArrowRight, Check, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function AiPricingCard() {
  const [applied, setApplied] = useState(false)

  const currentPrice = 350
  const suggestedPrice = 420
  const upside = Math.round(((suggestedPrice - currentPrice) / currentPrice) * 100)

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-border/60 bg-accent/40">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4.5" />
          </div>
          <div>
            <CardTitle className="text-base">Precificação Inteligente por IA</CardTitle>
            <p className="text-xs text-muted-foreground">
              Sugestões atualizadas a cada 6 horas
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="gap-1 text-primary">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          Ativo
        </Badge>
      </CardHeader>

      <CardContent className="p-5">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Imóvel</p>
              <p className="text-lg font-semibold text-foreground">
                Apartamento 2 Qts — Praia dos Ingleses
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5 text-primary" />
                Baseado em eventos locais e raio de 500m
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
                <p className="text-xs font-medium text-muted-foreground">Preço Atual</p>
                <p className="text-2xl font-semibold text-foreground">R$ 350</p>
              </div>

              <ArrowRight className="size-5 shrink-0 text-muted-foreground" />

              <div className="relative rounded-xl border border-primary/40 bg-primary/5 px-4 py-3">
                <p className="flex items-center gap-1 text-xs font-medium text-primary">
                  <Sparkles className="size-3" />
                  Sugerido pela IA
                </p>
                <div className="flex items-end gap-2">
                  <p className="text-2xl font-semibold text-primary">R$ 420</p>
                  <span className="mb-1 flex items-center gap-0.5 text-xs font-semibold text-emerald-600">
                    <TrendingUp className="size-3.5" />+{upside}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-2 lg:border-l lg:border-border/60 lg:pl-5">
            <button
              type="button"
              onClick={() => setApplied(true)}
              disabled={applied}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-default disabled:bg-emerald-600"
            >
              {applied ? (
                <>
                  <Check className="size-4" />
                  Preço Aplicado
                </>
              ) : (
                "Aplicar Preço"
              )}
            </button>
            <p className="text-center text-xs text-muted-foreground">
              {applied ? "Vigente a partir de hoje" : "Atualiza em todos os canais"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
