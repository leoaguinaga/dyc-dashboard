'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Requerimiento, EstadoRequerimiento, TipoRequerimiento } from '@/types/api'

export const TIPO_LABEL: Record<TipoRequerimiento, string> = {
  civil: 'Civil',
  electrico: 'Eléctrico',
  seguridad: 'Seguridad',
  administrativo: 'Admin.',
}

export const TIPO_CLASS: Record<TipoRequerimiento, string> = {
  civil: 'bg-blue-500/10 text-blue-600',
  electrico: 'bg-amber-500/10 text-amber-600',
  seguridad: 'bg-orange-500/10 text-orange-600',
  administrativo: 'bg-purple-500/10 text-purple-600',
}

export const ESTADO_LABEL: Record<EstadoRequerimiento, string> = {
  borrador: 'Borrador',
  enviado: 'Enviado',
  aprobado: 'Aprobado',
  observado: 'Observado',
  en_cotizacion: 'En cotización',
  pendiente_conformidad: 'Pendiente de conformidad',
  recibido: 'Recibido',
  cancelado: 'Cancelado',
}

export const ESTADO_CLASS: Record<EstadoRequerimiento, string> = {
  borrador: 'bg-muted text-muted-foreground',
  enviado: 'bg-blue-500/15 text-blue-600',
  aprobado: 'bg-chart-2/15 text-chart-2',
  observado: 'bg-amber-500/15 text-amber-600',
  en_cotizacion: 'bg-violet-500/15 text-violet-600',
  pendiente_conformidad: 'bg-orange-500/15 text-orange-600',
  recibido: 'bg-chart-2/15 text-chart-2',
  cancelado: 'bg-destructive/15 text-destructive',
}

export function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface Props {
  requerimientos: Requerimiento[]
  emptyMessage?: string
}

export function RequerimientosTableClient({ requerimientos, emptyMessage }: Props) {
  if (requerimientos.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-12 text-center">
        <p className="text-sm text-muted-foreground">
          {emptyMessage ?? 'No hay requerimientos con los filtros seleccionados'}
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
            <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Tipo</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Proyecto</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Solicitante</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Ítems</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Fecha</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {requerimientos.map((r) => (
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
  )
}
