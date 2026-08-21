'use client'

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KanbanBoard } from '@/components/shared/KanbanBoard'
import { ESTADO_LABEL, ESTADO_CLASS, TIPO_LABEL, TIPO_CLASS, fmt } from './RequerimientosTableClient'
import type { Requerimiento, EstadoRequerimiento } from '@/types/api'

const COLUMNS = (Object.keys(ESTADO_LABEL) as EstadoRequerimiento[]).map((key) => ({
  key,
  label: ESTADO_LABEL[key],
  colorClass: ESTADO_CLASS[key],
}))

interface Props {
  requerimientos: Requerimiento[]
  emptyMessage?: string
}

export function RequerimientosKanban({ requerimientos, emptyMessage }: Props) {
  return (
    <KanbanBoard
      items={requerimientos}
      columns={COLUMNS}
      getStatus={(r) => r.estado}
      getId={(r) => r.id}
      emptyMessage={emptyMessage ?? 'No hay requerimientos con los filtros seleccionados'}
      renderCard={(r) => (
        <Link
          href={`/requerimientos/${r.id}`}
          className="block rounded-lg border border-border bg-card p-3 text-sm shadow-sm transition-colors duration-120 hover:bg-muted/40"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-mono text-xs font-medium tabular-nums">
              {r.codigo}
              {r.urgente && <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />}
            </span>
            <span className={cn('inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium', TIPO_CLASS[r.tipo])}>
              {TIPO_LABEL[r.tipo]}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 font-medium">{r.nombre}</p>
          <p className="mt-1 text-xs text-muted-foreground">{r.proyecto.nombre}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate">{r.creadoPor.name}</span>
            <span className="shrink-0 font-mono tabular-nums">{fmt(r.creadoEn)}</span>
          </div>
        </Link>
      )}
    />
  )
}
