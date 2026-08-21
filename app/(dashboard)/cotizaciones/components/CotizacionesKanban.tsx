'use client'

import Link from 'next/link'
import { KanbanBoard } from '@/components/shared/KanbanBoard'
import { ESTADO_LABEL, ESTADO_CLASS, fmt } from './CotizacionesTableClient'
import type { SolicitudCotizacion, EstadoSolicitud } from '@/types/api'

const COLUMNS = (Object.keys(ESTADO_LABEL) as EstadoSolicitud[]).map((key) => ({
  key,
  label: ESTADO_LABEL[key],
  colorClass: ESTADO_CLASS[key],
}))

interface Props {
  solicitudes: SolicitudCotizacion[]
  emptyMessage?: string
}

export function CotizacionesKanban({ solicitudes, emptyMessage }: Props) {
  return (
    <KanbanBoard
      items={solicitudes}
      columns={COLUMNS}
      getStatus={(s) => s.estado}
      getId={(s) => s.id}
      emptyMessage={emptyMessage ?? 'No hay solicitudes con los filtros seleccionados'}
      renderCard={(s) => (
        <Link
          href={`/cotizaciones/${s.id}`}
          className="block rounded-lg border border-border bg-card p-3 text-sm shadow-sm transition-colors duration-120 hover:bg-muted/40"
        >
          <span className="font-mono text-xs font-medium tabular-nums">{s.codigo}</span>
          {s.requerimiento?.nombre && (
            <p className="mt-1 line-clamp-2 font-medium">{s.requerimiento.nombre}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">{s.proyecto?.nombre ?? '—'}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="tabular-nums">
              {s._count?.items ?? s.items?.length ?? 0} ítems · {s._count?.cotizaciones ?? s.cotizaciones?.length ?? 0} cotiz.
            </span>
            <span className="shrink-0 font-mono tabular-nums">{fmt(s.creadoEn)}</span>
          </div>
        </Link>
      )}
    />
  )
}
