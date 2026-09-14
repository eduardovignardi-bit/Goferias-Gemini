"use client"

import { Snowflake, Waves, Umbrella } from "lucide-react"
import { cn } from "@/lib/utils"
import { amenityLabels } from "./properties-data"

export type FilterState = {
  bedrooms: number | null
  bathrooms: number | null
  amenities: string[]
}

const amenityIcons: Record<string, React.ReactNode> = {
  "ar-condicionado": <Snowflake className="size-4" />,
  piscina: <Waves className="size-4" />,
  "proximo-praia": <Umbrella className="size-4" />,
}

type Props = {
  value: FilterState
  onChange: (next: FilterState) => void
}

export function AdvancedFilters({ value, onChange }: Props) {
  const setRoom = (key: "bedrooms" | "bathrooms", n: number) =>
    onChange({ ...value, [key]: value[key] === n ? null : n })

  const toggleAmenity = (a: string) =>
    onChange({
      ...value,
      amenities: value.amenities.includes(a)
        ? value.amenities.filter((x) => x !== a)
        : [...value.amenities, a],
    })

  return (
    <div className="flex flex-col gap-6">
      <RoomGroup
        title="Quartos"
        selected={value.bedrooms}
        onSelect={(n) => setRoom("bedrooms", n)}
      />
      <RoomGroup
        title="Banheiros"
        selected={value.bathrooms}
        onSelect={(n) => setRoom("bathrooms", n)}
      />

      <div>
        <h4 className="mb-3 text-sm font-semibold text-foreground">Comodidades</h4>
        <div className="flex flex-col gap-2">
          {(Object.keys(amenityLabels) as Array<keyof typeof amenityLabels>).map(
            (a) => {
              const checked = value.amenities.includes(a)
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  aria-pressed={checked}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                    checked
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border/70 text-foreground hover:bg-muted/60",
                  )}
                >
                  <span className={cn(checked ? "text-primary" : "text-muted-foreground")}>
                    {amenityIcons[a]}
                  </span>
                  {amenityLabels[a]}
                </button>
              )
            },
          )}
        </div>
      </div>
    </div>
  )
}

function RoomGroup({
  title,
  selected,
  onSelect,
}: {
  title: string
  selected: number | null
  onSelect: (n: number) => void
}) {
  const options = [
    { label: "1", value: 1 },
    { label: "2", value: 2 },
    { label: "3+", value: 3 },
  ]
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-foreground">{title}</h4>
      <div className="flex gap-2">
        {options.map((o) => {
          const active = selected === o.value
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onSelect(o.value)}
              aria-pressed={active}
              className={cn(
                "flex h-10 flex-1 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/70 text-foreground hover:bg-muted/60",
              )}
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
