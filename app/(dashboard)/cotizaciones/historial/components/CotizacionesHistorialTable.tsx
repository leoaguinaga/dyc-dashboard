'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api/client'
import { ESTADO_LABEL, ESTADO_CLASS, fmt } from '../../components/CotizacionesTableClient'
import { TIPO_LABEL } from '../../../requerimientos/components/RequerimientosTableClient'
import type { SolicitudCotizacion, TipoRequerimiento } from '@/types/api'

const PAGE_SIZE = 30

type TipoFilter = 'todos' | TipoRequerimiento

function fechaEstado(s: SolicitudCotizacion): string {
  if (s.estado === 'aprobada_gerencia' && s.aprobadaGerenciaEn) return s.aprobadaGerenciaEn
  if (s.estado === 'cancelada' && s.canceladaEn) return s.canceladaEn
  return s.actualizadoEn
}

interface Props {
  initial: SolicitudCotizacion[]
}

export function CotizacionesHistorialTable({ initial }: Props) {
  const [items, setItems] = useState(initial)
  const [offset, setOffset] = useState(initial.length)
  const [hasMore, setHasMore] = useState(initial.length >= PAGE_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearch] = useState('')
  const [obraId, setObraId] = useState<string>('todos')
  const [tipo, setTipo] = useState<TipoFilter>('todos')

  const proyectos = useMemo(() => {
    const map = new Map<string, { id: string; nombre: string; codigo?: string }>()
    for (const s of items) {
      if (s.proyecto) {
        map.set(s.proyecto.id, s.proyecto)
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      (a.codigo ? `${a.codigo} - ${a.nombre}` : a.nombre).localeCompare(
        b.codigo ? `${b.codigo} - ${b.nombre}` : b.nombre,
      ),
    )
  }, [items])

  const filtered = useMemo(() => {
    let result = items
    if (obraId !== 'todos') result = result.filter((s) => s.proyectoId === obraId || s.proyecto?.id === obraId)
    if (tipo !== 'todos') result = result.filter((s) => s.requerimiento?.tipo === tipo)
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
  }, [items, obraId, tipo, search])

  async function cargarMas() {
    setLoadingMore(true)
    try {
      const next = await api.get<SolicitudCotizacion[]>(
        `/solicitudes-cotizacion/historial?limit=${PAGE_SIZE}&offset=${offset}`,
      )
      setItems((prev) => [...prev, ...next])
      setOffset((prev) => prev + next.length)
      setHasMore(next.length >= PAGE_SIZE)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por código, concepto o proyecto…"
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
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {search.trim() ? `Sin resultados para "${search}"` : 'Sin registros en el historial'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Código</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Proyecto</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Ítems</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Cotizaciones</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Fecha de estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => (
                <tr key={s.id} className="transition-colors duration-120 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link href={`/cotizaciones/${s.id}`} className="font-mono text-sm font-medium tabular-nums hover:underline underline-offset-4">
                      {s.codigo}
                    </Link>
                    {s.requerimiento?.nombre && (
                      <p className="text-xs text-muted-foreground">{s.requerimiento.nombre}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{s.proyecto?.nombre ?? '—'}</p>
                    {s.proyecto?.codigo && (
                      <p className="text-xs text-muted-foreground font-mono">{s.proyecto.codigo}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', ESTADO_CLASS[s.estado])}>
                      {ESTADO_LABEL[s.estado]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {s._count?.items ?? s.items?.length ?? 0}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {s._count?.cotizaciones ?? s.cotizaciones?.length ?? 0}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono tabular-nums">
                    {fmt(fechaEstado(s))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && !search.trim() && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={cargarMas} disabled={loadingMore}>
            {loadingMore ? 'Cargando…' : 'Cargar más'}
          </Button>
        </div>
      )}
    </div>
  )
}
