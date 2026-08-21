'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { History, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTab, TabsIndicator, TabsPanel } from '@/components/ui/tabs'
import { CotizacionesTableClient, ESTADO_LABEL } from './CotizacionesTableClient'
import { CotizacionesKanban } from './CotizacionesKanban'
import type { SolicitudCotizacion, EstadoSolicitud } from '@/types/api'

type EstadoFilter = 'todos' | EstadoSolicitud
type View = 'kanban' | 'tabla'

interface Props {
  solicitudes: SolicitudCotizacion[]
}

export function CotizacionesView({ solicitudes }: Props) {
  const [view, setView] = useState<View>('kanban')
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState<EstadoFilter>('todos')

  const filtered = useMemo(() => {
    let result = solicitudes
    if (view === 'tabla' && estado !== 'todos') result = result.filter((s) => s.estado === estado)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (s) =>
          s.codigo.toLowerCase().includes(q) ||
          s.requerimiento?.nombre.toLowerCase().includes(q) ||
          s.proyecto?.nombre.toLowerCase().includes(q) ||
          s.proyecto?.codigo?.toLowerCase().includes(q),
      )
    }
    return result
  }, [solicitudes, view, estado, search])

  const emptyMessage = search.trim()
    ? `Sin resultados para "${search}"`
    : 'No hay solicitudes con los filtros seleccionados'

  return (
    <Tabs
      value={view}
      onValueChange={(v) => setView(v as View)}
      className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out"
    >
      <div className="flex flex-wrap items-center gap-2">
        <TabsList>
          <TabsIndicator />
          <TabsTab value="kanban">Kanban</TabsTab>
          <TabsTab value="tabla">Tabla</TabsTab>
        </TabsList>
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por código, concepto o proyecto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms]"
          />
        </div>
        {view === 'tabla' && (
          <Select value={estado} onValueChange={(v) => setEstado(v as EstadoFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {(Object.keys(ESTADO_LABEL) as EstadoSolicitud[]).map((e) => (
                <SelectItem key={e} value={e}>{ESTADO_LABEL[e]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Link href="/cotizaciones/historial">
          <Button variant="outline">
            <History className="size-4" />
            Historial
          </Button>
        </Link>
        <Link href="/cotizaciones/nueva">
          <Button>
            <Plus className="size-4" />
            Nueva solicitud
          </Button>
        </Link>
      </div>

      <TabsPanel value="kanban">
        <CotizacionesKanban solicitudes={filtered} emptyMessage={emptyMessage} />
      </TabsPanel>
      <TabsPanel value="tabla">
        <CotizacionesTableClient solicitudes={filtered} emptyMessage={emptyMessage} />
      </TabsPanel>
    </Tabs>
  )
}
