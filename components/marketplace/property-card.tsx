"use client"

import { useState } from "react"
import Image from "next/image"
import {
  ChevronLeft,
  ChevronRight,
  BedDouble,
  Bath,
  Footprints,
  Star,
  Sparkles,
  Heart,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Property, PropertySource } from "./properties-data"

const sourceStyles: Record<
  PropertySource,
  { label: string; className: string }
> = {
  GoFerias: {
    label: "Direto GoFerias",
    className: "bg-primary text-primary-foreground",
  },
  Airbnb: {
    label: "Importado via Airbnb",
    className: "bg-rose-500 text-white",
  },
  Booking: {
    label: "Importado via Booking",
    className: "bg-blue-700 text-white",
  },
}

export function PropertyCard({ property }: { property: Property }) {
  const [index, setIndex] = useState(0)
  const [liked, setLiked] = useState(false)
  const total = property.images.length
  const source = sourceStyles[property.source]

  const go = (dir: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIndex((prev) => (prev + dir + total) % total)
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card transition-shadow hover:shadow-lg hover:shadow-primary/5">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={property.images[index] || "/placeholder.svg"}
          alt={property.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Origem */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge className={cn("border-0 shadow-sm", source.className)}>
            {source.label}
          </Badge>
        </div>

        {/* Favoritar */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            setLiked((v) => !v)
          }}
          aria-label={liked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-white"
        >
          <Heart className={cn("size-4", liked && "fill-rose-500 text-rose-500")} />
        </button>

        {/* Carrossel */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={go(-1)}
              aria-label="Imagem anterior"
              className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={go(1)}
              aria-label="Próxima imagem"
              className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 focus:opacity-100"
            >
              <ChevronRight className="size-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {property.images.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "size-1.5 rounded-full bg-white/60 transition-all",
                    i === index && "w-4 bg-white",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-snug text-foreground">
            {property.title}
          </h3>
          <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            {property.rating.toFixed(1)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BedDouble className="size-3.5" />
            {property.bedrooms} {property.bedrooms > 1 ? "quartos" : "quarto"}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="size-3.5" />
            {property.bathrooms} {property.bathrooms > 1 ? "banheiros" : "banheiro"}
          </span>
          <span className="flex items-center gap-1">
            <Footprints className="size-3.5" />
            {property.beachDistance}m da praia
          </span>
        </div>

        {property.aiOptimized && (
          <div className="flex items-center gap-1.5 rounded-md bg-primary/8 px-2 py-1 text-xs font-medium text-primary w-fit">
            <Sparkles className="size-3" />
            Preço Otimizado por IA
          </div>
        )}

        <div className="mt-auto flex items-baseline gap-1 pt-2">
          <span className="text-lg font-semibold text-foreground">
            R$ {property.pricePerNight.toLocaleString("pt-BR")}
          </span>
          <span className="text-xs text-muted-foreground">/ diária</span>
        </div>
      </div>
    </article>
  )
}
