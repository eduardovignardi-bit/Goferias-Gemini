import type { Metadata } from "next"
import { Sidebar } from "@/components/dashboard/sidebar"
import { SettingsView } from "@/components/settings/settings-view"

export const metadata: Metadata = {
  title: "Configurações | GoFerias",
  description: "Gerencie suas integrações e canais de distribuição no GoFerias.",
}

export default function ConfiguracoesPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto">
        <SettingsView />
      </main>
    </div>
  )
}
