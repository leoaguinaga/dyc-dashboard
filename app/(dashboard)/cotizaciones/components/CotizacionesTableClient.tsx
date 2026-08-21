'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { SolicitudCotizacion, EstadoSolicitud } from '@/types/api'

export const ESTADO_LABEL: Record<EstadoSolicitud, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  cotizada: 'Cotizada',
  seleccionada: 'Adjudicada',
  aprobada_solicitante: 'Esperando gerencia',
  aprobada_gerencia: 'Aprobada',
  orden_generada: 'Orden generada',
  cancelada: 'Cancelada',
}

export const ESTADO_CLASS: Record<EstadoSolicitud, string> = {
  borrador: 'bg-muted text-muted-foreground',
  enviada: 'bg-blue-500/15 text-blue-600',
  cotizada: 'bg-amber-500/15 text-amber-600',
  seleccionada: 'bg-purple-500/15 text-purple-600',
  aprobada_solicitante: 'bg-orange-500/15 text-orange-600',
  aprobada_gerencia: 'bg-chart-2/15 text-chart-2',
  orden_generada: 'bg-slate-500/15 text-slate-600',
  cancelada: 'bg-destructive/10 text-destructive',
}

export function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface Props {
  solicitudes: SolicitudCotizacion[]
  emptyMessage?: string
}

export function CotizacionesTableClient({ solicitudes, emptyMessage }: Props) {
  if (solicitudes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center">
        <p className="text-sm text-muted-foreground">
          {emptyMessage ?? 'No hay solicitudes con los filtros seleccionados'}
        </p>
      </div>
    )
  }

  return (
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
          {solicitudes.map((s) => (
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
                {fmt(s.creadoEn)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
