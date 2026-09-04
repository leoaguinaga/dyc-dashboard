'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { KanbanBoard } from '@/components/shared/KanbanBoard'
import { ESTADO_LABEL, ESTADO_CLASS, fmt } from './CotizacionesTableClient'
import { CotizacionesLeyend } from './CotizacionesLeyend'
import { TIPO_COLOR } from '../../requerimientos/components/RequerimientosTableClient'
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
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })
  }

  const handleScrollRight = () => {
    scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })
  }

  return (
    <div className="space-y-3">
      <CotizacionesLeyend
        onScrollLeft={handleScrollLeft}
        onScrollRight={handleScrollRight}
      />
      <KanbanBoard
        scrollRef={scrollRef}
        items={solicitudes}
        columns={COLUMNS}
        getStatus={(s) => s.estado}
        getId={(s) => s.id}
        emptyMessage={emptyMessage ?? 'No hay solicitudes con los filtros seleccionados'}
        renderCard={(s) => {
          const tipo = s.requerimiento?.tipo
          return (
            <Link
              href={`/cotizaciones/${s.id}`}
              className="flex items-stretch gap-2.5 rounded-lg border border-border bg-card p-3 text-sm shadow-sm transition-colors duration-[120ms] hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              <div
                className={cn(
                  'w-1.5 shrink-0 self-stretch rounded-xl',
                  tipo ? TIPO_COLOR[tipo] : 'bg-muted-foreground/30',
                )}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-sm font-medium tabular-nums">
                      {s.codigo}
                    </span>
                    {s.requerimiento?.nombre && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {s.requerimiento.nombre}
                      </p>
                    )}
                  </div>
                </div>
                <p className="mt-2 text-xs font-medium">
                  {s.proyecto?.nombre ?? '—'}
                </p>
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="tabular-nums">
                    {s._count?.items ?? s.items?.length ?? 0} ítems · {s._count?.cotizaciones ?? s.cotizaciones?.length ?? 0} cotiz.
                  </span>
                  <span className="shrink-0 font-mono tabular-nums">{fmt(s.creadoEn)}</span>
                </div>
              </div>
            </Link>
          )
        }}
      />
    </div>
  )
}
