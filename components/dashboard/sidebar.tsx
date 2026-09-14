"use client"

import { useState } from "react"
import {
  LayoutDashboard,
  Building2,
  Store,
  Settings,
  Sparkles,
  Waves,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Meus Imóveis", icon: Building2, active: false },
  { label: "Marketplace Público", icon: Store, active: false },
  { label: "Configurações", icon: Settings, active: false },
]

export function Sidebar() {
  const [active, setActive] = useState("Dashboard")

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <Waves className="size-5" />
        </div>
        <div className="leading-tight">
          <p className="text-base font-semibold tracking-tight">GoFerias</p>
          <p className="text-xs text-sidebar-foreground/60">Ingleses, Floripa</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = active === item.label
          return (
            <button
              key={item.label}
              type="button"
              onClick={() => setActive(item.label)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4.5 shrink-0" />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="p-4">
        <div className="rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/70 p-4 text-sidebar-primary-foreground">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="size-4" />
            <span className="text-sm font-semibold">Plano Pro</span>
          </div>
          <p className="mb-3 text-xs leading-relaxed text-sidebar-primary-foreground/80">
            Desbloqueie precificação ilimitada por IA e análise de concorrentes.
          </p>
          <button
            type="button"
            className="w-full rounded-lg bg-white/95 px-3 py-2 text-sm font-semibold text-sidebar-primary transition-colors hover:bg-white"
          >
            Fazer Upgrade
          </button>
        </div>
      </div>
    </aside>
  )
}
