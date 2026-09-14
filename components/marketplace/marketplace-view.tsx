"use client"

import { useMemo, useState } from "react"
import { Waves, SlidersHorizontal, X, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { properties } from "./properties-data"
import { SearchBar, type SearchState } from "./search-bar"
import { AdvancedFilters, type FilterState } from "./advanced-filters"
import { PropertyCard } from "./property-card"

const emptyFilters: FilterState = {
  bedrooms: null,
  bathrooms: null,
  amenities: [],
}

export function MarketplaceView() {
  const [search, setSearch] = useState<SearchState>({
    checkIn: "",
    checkOut: "",
    guests: "",
    type: "todos",
  })
  const [filters, setFilters] = useState<FilterState>(emptyFilters)
  const [mobileOpen, setMobileOpen] = useState(false)

  const filtered = useMemo(() => {
    return properties.filter((p) => {
      if (search.type && search.type !== "todos" && p.type !== search.type) return false
      if (search.guests && p.guests < Number(search.guests)) return false
      if (filters.bedrooms) {
        if (filters.bedrooms === 3 ? p.bedrooms < 3 : p.bedrooms !== filters.bedrooms)
          return false
      }
      if (filters.bathrooms) {
        if (filters.bathrooms === 3 ? p.bathrooms < 3 : p.bathrooms !== filters.bathrooms)
          return false
      }
      if (filters.amenities.length > 0) {
        if (!filters.amenities.every((a) => p.amenities.includes(a as never)))
          return false
      }
      return true
    })
  }, [search, filters])

  const activeFilterCount =
    (filters.bedrooms ? 1 : 0) +
    (filters.bathrooms ? 1 : 0) +
    filters.amenities.length

  return (
    <div className="min-h-screen bg-background">
      {/* Cabeçalho */}
      <header className="sticky top-0 z-30 border-b border-border/70 bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Waves className="size-5" />
            </div>
            <div className="leading-tight">
              <p className="text-base font-semibold tracking-tight text-foreground">
                GoFerias
              </p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                Ingleses, Florianópolis
              </p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex">
            <a href="#" className="transition-colors hover:text-foreground">
              Explorar
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Como funciona
            </a>
            <a
              href="/"
              className="rounded-lg bg-secondary px-4 py-2 text-secondary-foreground transition-colors hover:bg-secondary/80"
            >
              Anuncie seu imóvel
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Título */}
        <div className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Aluguel de temporada nos Ingleses
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Anúncios diretos e importados de outras plataformas, num só lugar.
          </p>
        </div>

        {/* Barra de busca */}
        <SearchBar value={search} onChange={setSearch} />

        <div className="mt-6 flex gap-6">
          {/* Filtros laterais (desktop) */}
          <aside className="hidden w-64 shrink-0 lg:block">
            <div className="sticky top-24 rounded-2xl border border-border/70 bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Filtros</h2>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilters(emptyFilters)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Limpar
                  </button>
                )}
              </div>
              <AdvancedFilters value={filters} onChange={setFilters} />
            </div>
          </aside>

          {/* Grade de anúncios */}
          <section className="min-w-0 flex-1">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
                {filtered.length === 1 ? "imóvel encontrado" : "imóveis encontrados"}
              </p>

              {/* Botão de filtros (mobile) */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-border/70 bg-card px-3 py-2 text-sm font-medium text-foreground lg:hidden"
              >
                <SlidersHorizontal className="size-4" />
                Filtros
                {activeFilterCount > 0 && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {filtered.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
                <p className="text-sm font-medium text-foreground">
                  Nenhum imóvel encontrado
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tente ajustar os filtros de busca.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Modal de filtros (mobile) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-card p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Filtros</h2>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar filtros"
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <AdvancedFilters value={filters} onChange={setFilters} />

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setFilters(emptyFilters)}
                className="flex-1 rounded-lg border border-border/70 px-4 py-3 text-sm font-medium text-foreground"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
              >
                Ver {filtered.length}{" "}
                {filtered.length === 1 ? "imóvel" : "imóveis"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
