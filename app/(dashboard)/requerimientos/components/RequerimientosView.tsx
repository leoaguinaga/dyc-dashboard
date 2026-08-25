'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { History, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTab, TabsIndicator, TabsPanel } from '@/components/ui/tabs'
import { RequerimientosTableClient, ESTADO_LABEL, TIPO_LABEL } from './RequerimientosTableClient'
import { RequerimientosKanban } from './RequerimientosKanban'
import type { Requerimiento, EstadoRequerimiento, TipoRequerimiento } from '@/types/api'

type EstadoFilter = 'todos' | EstadoRequerimiento
type TipoFilter = 'todos' | TipoRequerimiento
type View = 'kanban' | 'tabla'

interface Props {
  requerimientos: Requerimiento[]
}

export function RequerimientosView({ requerimientos }: Props) {
  const [view, setView] = useState<View>('kanban')
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState<EstadoFilter>('todos')
  const [obraId, setObraId] = useState<string>('todos')
  const [tipo, setTipo] = useState<TipoFilter>('todos')

  const proyectos = useMemo(() => {
    const map = new Map<string, { id: string; nombre: string; codigo?: string }>()
    for (const r of requerimientos) {
      if (r.proyecto) {
        map.set(r.proyecto.id, r.proyecto)
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      (a.codigo ? `${a.codigo} - ${a.nombre}` : a.nombre).localeCompare(
        b.codigo ? `${b.codigo} - ${b.nombre}` : b.nombre,
      ),
    )
  }, [requerimientos])

  const filtered = useMemo(() => {
    let result = requerimientos
    if (view === 'tabla' && estado !== 'todos') result = result.filter((r) => r.estado === estado)
    if (obraId !== 'todos') result = result.filter((r) => r.proyectoId === obraId || r.proyecto?.id === obraId)
    if (tipo !== 'todos') result = result.filter((r) => r.tipo === tipo)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (r) =>
          r.codigo.toLowerCase().includes(q) ||
          r.nombre.toLowerCase().includes(q) ||
          r.proyecto.nombre.toLowerCase().includes(q) ||
          r.proyecto.codigo?.toLowerCase().includes(q) ||
          r.creadoPor.name.toLowerCase().includes(q),
      )
    }
    return result
  }, [requerimientos, view, estado, obraId, tipo, search])

  const emptyMessage = search.trim()
    ? `Sin resultados para "${search}"`
    : 'No hay requerimientos con los filtros seleccionados'

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
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por código, proyecto o solicitante…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms]"
          />
        </div>
        <Select value={obraId} onValueChange={(v) => setObraId(v ?? 'todos')}>
          <SelectTrigger className="w-40 sm:w-48">
            <SelectValue>
              {obraId === 'todos' ? 'Todas las obras' : (proyectos.find((p) => p.id === obraId)?.nombre ?? 'Obra')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las obras</SelectItem>
            {proyectos.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.codigo ? `${p.codigo} - ${p.nombre}` : p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tipo} onValueChange={(v) => setTipo(v as TipoFilter)}>
          <SelectTrigger className="w-36">
            <SelectValue>
              {tipo === 'todos' ? 'Todos los tipos' : (TIPO_LABEL[tipo as TipoRequerimiento] ?? 'Tipo')}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {(Object.keys(TIPO_LABEL) as TipoRequerimiento[]).map((t) => (
              <SelectItem key={t} value={t}>
                {TIPO_LABEL[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {view === 'tabla' && (
          <Select value={estado} onValueChange={(v) => setEstado(v as EstadoFilter)}>
            <SelectTrigger className="w-36">
              <SelectValue>
                {estado === 'todos' ? 'Todos los estados' : (ESTADO_LABEL[estado as EstadoRequerimiento] ?? 'Estado')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              {(Object.keys(ESTADO_LABEL) as EstadoRequerimiento[]).map((e) => (
                <SelectItem key={e} value={e}>{ESTADO_LABEL[e]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Link href="/requerimientos/historial">
          <Button variant="outline">
            <History className="size-4" />
            Historial
          </Button>
        </Link>
        <Link href="/requerimientos/nuevo">
          <Button>
            <Plus className="size-4" />
            Nuevo requerimiento
          </Button>
        </Link>
      </div>

      <TabsPanel value="kanban">
        <RequerimientosKanban requerimientos={filtered} emptyMessage={emptyMessage} />
      </TabsPanel>
      <TabsPanel value="tabla">
        <RequerimientosTableClient requerimientos={filtered} emptyMessage={emptyMessage} />
      </TabsPanel>
    </Tabs>
  )
}
