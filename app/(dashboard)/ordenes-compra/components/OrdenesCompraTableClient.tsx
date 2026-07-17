'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn, formatCurrency } from '@/lib/utils'
import type { EstadoOrdenCompra, OrdenCompra } from '@/types/api'

const ESTADO_LABEL: Record<EstadoOrdenCompra, string> = {
  borrador: 'Borrador',
  emitida: 'Emitida',
  recibida_parcial: 'Recep. parcial',
  recibida: 'Recibida',
  cancelada: 'Cancelada',
}

const ESTADO_CLASS: Record<EstadoOrdenCompra, string> = {
  borrador: 'bg-muted text-muted-foreground',
  emitida: 'bg-blue-500/10 text-blue-600',
  recibida_parcial: 'bg-amber-500/10 text-amber-600',
  recibida: 'bg-chart-2/10 text-chart-2',
  cancelada: 'bg-destructive/10 text-destructive',
}

type EstadoFilter = 'todos' | EstadoOrdenCompra

interface Props {
  ordenes: OrdenCompra[]
}

export function OrdenesCompraTableClient({ ordenes }: Props) {
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState<EstadoFilter>('todos')
  const [proyectoId, setProyectoId] = useState<string>('todos')

  const proyectos = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>()
    for (const oc of ordenes) {
      if (!map.has(oc.proyectoId)) {
        map.set(oc.proyectoId, { id: oc.proyectoId, label: oc.proyecto.codigo ?? oc.proyecto.nombre })
      }
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label))
  }, [ordenes])

  const filtered = useMemo(() => {
    let result = ordenes
    if (estado !== 'todos') result = result.filter((oc) => oc.estado === estado)
    if (proyectoId !== 'todos') result = result.filter((oc) => oc.proyectoId === proyectoId)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(
        (oc) =>
          oc.numero.toLowerCase().includes(q) ||
          oc.nombre?.toLowerCase().includes(q) ||
          oc.proveedor.razonSocial.toLowerCase().includes(q) ||
          oc.proyecto.nombre.toLowerCase().includes(q) ||
          oc.proyecto.codigo?.toLowerCase().includes(q) ||
          oc.solicitud.codigo.toLowerCase().includes(q),
      )
    }
    return result
  }, [ordenes, estado, proyectoId, search])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por N° OC, proveedor, proyecto o solicitud…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms]"
          />
        </div>
        <Select value={estado} onValueChange={(v) => setEstado(v as EstadoFilter)}>
          <SelectTrigger className="w-40">
            Estados
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {(Object.keys(ESTADO_LABEL) as EstadoOrdenCompra[]).map((e) => (
              <SelectItem key={e} value={e}>{ESTADO_LABEL[e]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={proyectoId} onValueChange={(v) => setProyectoId(v ?? 'todos')}>
          <SelectTrigger className="w-48">
            Proyecto
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los proyectos</SelectItem>
            {proyectos.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-white py-16 text-center space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {search.trim() ? `Sin resultados para "${search}"` : 'No hay órdenes de compra con los filtros seleccionados'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">N° OC</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Proveedor</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Proyecto</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Solicitud</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Monto</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha emisión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((oc) => (
                <tr key={oc.id} className="hover:bg-muted/30 transition-colors duration-[120ms]">
                  <td className="px-4 py-3">
                    <Link href={`/ordenes-compra/${oc.id}`} className="hover:text-primary transition-colors duration-[120ms]">
                      <span className="block font-mono font-medium">{oc.numero}</span>
                      {oc.nombre && <span className="block text-xs text-muted-foreground">{oc.nombre}</span>}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium">{oc.proveedor.razonSocial}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <Link href={`/proyectos/${oc.proyectoId}`} className="hover:text-foreground transition-colors duration-[120ms]">
                      {oc.proyecto.codigo ?? oc.proyecto.nombre}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/cotizaciones/${oc.solicitudId}`} className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors duration-[120ms]">
                      {oc.solicitud.codigo}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">
                    {formatCurrency(oc.montoTotal)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium', ESTADO_CLASS[oc.estado])}>
                      {ESTADO_LABEL[oc.estado]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {oc.fechaEmision
                      ? new Date(oc.fechaEmision).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
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
