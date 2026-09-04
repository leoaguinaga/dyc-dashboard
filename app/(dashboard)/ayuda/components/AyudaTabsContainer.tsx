'use client'

import { BookOpen, Library } from 'lucide-react'
import { useState } from 'react'
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from '@/components/ui/tabs'
import { useSession } from '@/lib/auth/session'
import type { HelpVideo, Role } from '@/types/api'
import { GuiasUso } from './GuiasUso'
import { MiAyuda } from './MiAyuda'
import { ROLES_INFO } from './guias-data'

interface Props {
  initialVideos: HelpVideo[]
}

export function AyudaTabsContainer({ initialVideos }: Props) {
  const [tab, setTab] = useState('mi-ayuda')
  const { data: session } = useSession()
  const role = session?.user?.role as Role | undefined
  const roleId = role && ['supervisor', 'supervisor_civil', 'supervisor_electrico', 'ing_civil', 'ing_electrico'].includes(role)
    ? 'supervisores_campo'
    : ROLES_INFO.find((item) => item.roleKey === role)?.id ?? 'supervisores_campo'
  const currentRole = ROLES_INFO.find((item) => item.id === roleId) ?? ROLES_INFO[0]
  const isLibrary = tab === 'biblioteca'

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <div className="space-y-1">
        <h1 id="ayuda-page-heading" className="text-2xl font-semibold tracking-tight">
          {isLibrary ? 'Biblioteca de ayuda' : '¿Qué necesitas hacer?'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isLibrary
            ? 'Encuentra instrucciones para completar una tarea sin salir de Ayuda.'
            : `Ayuda seleccionada para ${currentRole.cargo}. Busca una tarea o elige una acción frecuente.`}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <TabsList className="h-10 bg-muted/80 p-1 rounded-xl">
          <TabsIndicator className="rounded-lg shadow-xs" />
          <TabsTab
            value="mi-ayuda"
            className="flex items-center gap-2 px-4 py-1.5 text-xs sm:text-sm font-semibold cursor-pointer"
          >
            <BookOpen className="size-4" />
            <span>Mi ayuda</span>
          </TabsTab>
          <TabsTab
            value="biblioteca"
            className="flex items-center gap-2 px-4 py-1.5 text-xs sm:text-sm font-semibold cursor-pointer"
          >
            <Library className="size-4" />
            <span>Biblioteca</span>
          </TabsTab>
        </TabsList>
      </div>

      <TabsPanel value="mi-ayuda">
        <MiAyuda currentRole={currentRole} onOpenLibrary={() => setTab('biblioteca')} />
      </TabsPanel>
      <TabsPanel value="biblioteca">
        <GuiasUso videos={initialVideos} />
      </TabsPanel>
    </Tabs>
  )
}
