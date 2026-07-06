'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronRight, Plus, Search } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { SolicitudCotizacion, EstadoSolicitud } from '@/types/api'

const ESTADO_LABEL: Record<EstadoSolicitud, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  cotizada: 'Cotizada',
  seleccionada: 'Seleccionada',
  aprobada_solicitante: 'Aprobada (sol.)',
  aprobada_gerencia: 'Aprobada',
  cancelada: 'Cancelada',
}

const ESTADO_CLASS: Record<EstadoSolicitud, string> = {
  borrador: 'bg-muted text-muted-foreground',
  enviada: 'bg-blue-500/15 text-blue-600',
  cotizada: 'bg-amber-500/15 text-amber-600',
  seleccionada: 'bg-purple-500/15 text-purple-600',
  aprobada_solicitante: 'bg-chart-2/10 text-chart-2',
  aprobada_gerencia: 'bg-chart-2/15 text-chart-2',
  cancelada: 'bg-destructive/10 text-destructive',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

type EstadoFilter = 'todos' | EstadoSolicitud

interface Props {
  solicitudes: SolicitudCotizacion[]
}

export function CotizacionesTableClient({ solicitudes }: Props) {
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState<EstadoFilter>('todos')

  const filtered = useMemo(() => {
    let result = solicitudes
    if (estado !== 'todos') result = result.filter((s) => s.estado === estado)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (s) =>
          s.codigo.toLowerCase().includes(q) ||
          s.proyecto?.nombre.toLowerCase().includes(q) ||
          s.proyecto?.codigo?.toLowerCase().includes(q),
      )
    }
    return result
  }, [solicitudes, estado, search])

  return (
    <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por código o proyecto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms]"
          />
        </div>
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
        <Link href="/cotizaciones/nueva">
          <Button>
            <Plus className="size-4" />
            Nueva solicitud
          </Button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {search.trim() ? `Sin resultados para "${search}"` : 'No hay solicitudes con los filtros seleccionados'}
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
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => (
                <tr key={s.id} className="transition-colors duration-120 hover:bg-muted/40">
                  <td className="px-4 py-3 font-mono text-sm font-medium tabular-nums">
                    <Link href={`/cotizaciones/${s.id}`} className='hover:underline underline-offset-4'>
                      {s.codigo}
                    </Link>
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
                    {fmt(s.creadoEn)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
