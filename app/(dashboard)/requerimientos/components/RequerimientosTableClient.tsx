'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ChevronRight, Plus, Search, AlertTriangle } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Requerimiento, EstadoRequerimiento, TipoRequerimiento } from '@/types/api'

const TIPO_LABEL: Record<TipoRequerimiento, string> = {
  civil: 'Civil',
  electrico: 'Eléctrico',
  seguridad: 'Seguridad',
  administrativo: 'Admin.',
}

const TIPO_CLASS: Record<TipoRequerimiento, string> = {
  civil: 'bg-blue-500/10 text-blue-600',
  electrico: 'bg-amber-500/10 text-amber-600',
  seguridad: 'bg-orange-500/10 text-orange-600',
  administrativo: 'bg-purple-500/10 text-purple-600',
}

const ESTADO_LABEL: Record<EstadoRequerimiento, string> = {
  borrador: 'Borrador',
  enviado: 'Enviado',
  aprobado: 'Aprobado',
  observado: 'Observado',
}

const ESTADO_CLASS: Record<EstadoRequerimiento, string> = {
  borrador: 'bg-muted text-muted-foreground',
  enviado: 'bg-blue-500/15 text-blue-600',
  aprobado: 'bg-chart-2/15 text-chart-2',
  observado: 'bg-amber-500/15 text-amber-600',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

type EstadoFilter = 'todos' | EstadoRequerimiento

interface Props {
  requerimientos: Requerimiento[]
}

export function RequerimientosTableClient({ requerimientos }: Props) {
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState<EstadoFilter>('todos')

  const filtered = useMemo(() => {
    let result = requerimientos
    if (estado !== 'todos') result = result.filter((r) => r.estado === estado)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (r) =>
          r.codigo.toLowerCase().includes(q) ||
          r.nombre.toLowerCase().includes(q) ||
          r.proyecto.nombre.toLowerCase().includes(q) ||
          r.creadoPor.name.toLowerCase().includes(q),
      )
    }
    return result
  }, [requerimientos, estado, search])

  return (
    <div className="space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por código, proyecto o solicitante…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms]"
          />
        </div>
        <Select value={estado} onValueChange={(v) => setEstado(v as EstadoFilter)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {(Object.keys(ESTADO_LABEL) as EstadoRequerimiento[]).map((e) => (
              <SelectItem key={e} value={e}>{ESTADO_LABEL[e]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Link href="/requerimientos/nuevo">
          <Button>
            <Plus className="size-4" />
            Nuevo requerimiento
          </Button>
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {search.trim() ? `Sin resultados para "${search}"` : 'No hay requerimientos con los filtros seleccionados'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Código</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Tipo</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Proyecto</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Solicitante</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Ítems</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => (
                <tr key={r.id} className="transition-colors duration-120 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <Link href={`/requerimientos/${r.id}`} className="hover:underline underline-offset-4">
                      <span className="flex items-center gap-1.5 font-mono text-sm font-medium tabular-nums">
                        {r.codigo}
                        {r.urgente && <AlertTriangle className="size-3.75 text-amber-500 shrink-0" />}
                      </span>
                      <span className="block text-xs text-muted-foreground">{r.nombre}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', TIPO_CLASS[r.tipo])}>
                      {TIPO_LABEL[r.tipo]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.proyecto.nombre}</p>
                    {r.proyecto.codigo && (
                      <p className="text-xs text-muted-foreground font-mono">{r.proyecto.codigo}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{r.creadoPor.name}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', ESTADO_CLASS[r.estado])}>
                      {ESTADO_LABEL[r.estado]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">{r.items.length}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono tabular-nums">
                    {fmt(r.creadoEn)}
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
