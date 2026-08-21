'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api/client'
import { ESTADO_LABEL, ESTADO_CLASS, fmt } from '../../components/CotizacionesTableClient'
import type { SolicitudCotizacion } from '@/types/api'

const PAGE_SIZE = 30

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

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.trim().toLowerCase()
    return items.filter(
      (s) =>
        s.codigo.toLowerCase().includes(q) ||
        s.requerimiento?.nombre.toLowerCase().includes(q) ||
        s.proyecto?.nombre.toLowerCase().includes(q) ||
        s.proyecto?.codigo?.toLowerCase().includes(q),
    )
  }, [items, search])

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
      <div className="relative min-w-0">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar por código, concepto o proyecto…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-full max-w-sm rounded-lg border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms]"
        />
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
