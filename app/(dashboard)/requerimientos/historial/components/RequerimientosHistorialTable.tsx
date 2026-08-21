'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { AlertTriangle, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api/client'
import { ESTADO_LABEL, ESTADO_CLASS, TIPO_LABEL, TIPO_CLASS, fmt } from '../../components/RequerimientosTableClient'
import type { Requerimiento } from '@/types/api'

const PAGE_SIZE = 30

function fechaEstado(r: Requerimiento): string {
  if (r.estado === 'recibido' && r.recepcionEn) return r.recepcionEn
  const entrada = [...(r.historial ?? [])].reverse().find((h) => h.estado === r.estado)
  return entrada?.creadoEn ?? r.actualizadoEn
}

interface Props {
  initial: Requerimiento[]
}

export function RequerimientosHistorialTable({ initial }: Props) {
  const [items, setItems] = useState(initial)
  const [offset, setOffset] = useState(initial.length)
  const [hasMore, setHasMore] = useState(initial.length >= PAGE_SIZE)
  const [loadingMore, setLoadingMore] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.trim().toLowerCase()
    return items.filter(
      (r) =>
        r.codigo.toLowerCase().includes(q) ||
        r.nombre.toLowerCase().includes(q) ||
        r.proyecto.nombre.toLowerCase().includes(q) ||
        r.creadoPor.name.toLowerCase().includes(q),
    )
  }, [items, search])

  async function cargarMas() {
    setLoadingMore(true)
    try {
      const next = await api.get<Requerimiento[]>(
        `/requerimientos/historial?limit=${PAGE_SIZE}&offset=${offset}`,
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
          placeholder="Buscar por código, proyecto o solicitante…"
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
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Tipo</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Proyecto</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Solicitante</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Ítems</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Fecha de estado</th>
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
                    {fmt(fechaEstado(r))}
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
