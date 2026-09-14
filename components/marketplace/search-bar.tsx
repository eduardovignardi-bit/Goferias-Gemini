"use client"

import { CalendarDays, Users, Home, Search } from "lucide-react"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type SearchState = {
  checkIn: string
  checkOut: string
  guests: string
  type: string
}

type Props = {
  value: SearchState
  onChange: (next: SearchState) => void
}

export function SearchBar({ value, onChange }: Props) {
  const set = (key: keyof SearchState) => (v: string) =>
    onChange({ ...value, [key]: v })

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
        <Field label="Check-in" icon={<CalendarDays className="size-4 text-primary" />}>
          <input
            type="date"
            value={value.checkIn}
            onChange={(e) => set("checkIn")(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground outline-none [color-scheme:light]"
          />
        </Field>

        <Field label="Check-out" icon={<CalendarDays className="size-4 text-primary" />}>
          <input
            type="date"
            value={value.checkOut}
            onChange={(e) => set("checkOut")(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground outline-none [color-scheme:light]"
          />
        </Field>

        <Field label="Hóspedes" icon={<Users className="size-4 text-primary" />}>
          <Select value={value.guests} onValueChange={set("guests")}>
            <SelectTrigger className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus:ring-0">
              <SelectValue placeholder="Quantos?" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} {n > 1 ? "hóspedes" : "hóspede"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Tipo de imóvel" icon={<Home className="size-4 text-primary" />}>
          <Select value={value.type} onValueChange={set("type")}>
            <SelectTrigger className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus:ring-0">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="Apartamento">Apartamento</SelectItem>
              <SelectItem value="Casa">Casa</SelectItem>
              <SelectItem value="Studio">Studio</SelectItem>
              <SelectItem value="Cobertura">Cobertura</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 lg:px-5"
        >
          <Search className="size-4" />
          <span className="lg:sr-only xl:not-sr-only">Buscar</span>
        </button>
      </div>
    </div>
  )
}

function Field({
  label,
  icon,
  children,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background px-3 py-2">
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <Label className="block text-[11px] font-medium text-muted-foreground">
          {label}
        </Label>
        {children}
      </div>
    </div>
  )
}
