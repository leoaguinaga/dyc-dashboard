'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KanbanBoard } from '@/components/shared/KanbanBoard'
import { ESTADO_LABEL, ESTADO_CLASS, TIPO_COLOR, fmt } from './RequerimientosTableClient'
import RequerimientosLeyend from './RequerimientosLeyend'
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
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })
  }

  const handleScrollRight = () => {
    scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })
  }

  return (
    <div className="space-y-3">
      <RequerimientosLeyend
        onScrollLeft={handleScrollLeft}
        onScrollRight={handleScrollRight}
      />
      <KanbanBoard
        scrollRef={scrollRef}
        items={requerimientos}
        columns={COLUMNS}
        getStatus={(r) => r.estado}
        getId={(r) => r.id}
        emptyMessage={emptyMessage ?? 'No hay requerimientos con los filtros seleccionados'}
        renderCard={(r) => (
          <Link
            href={`/requerimientos/${r.id}`}
            className="flex items-stretch gap-2.5 rounded-lg border border-border bg-card p-3 text-sm shadow-sm transition-colors duration-120 hover:bg-muted/40"
          >
            <div
              className={cn(
                'w-1.5 shrink-0 self-stretch rounded-xl',
                TIPO_COLOR[r.tipo] ?? 'bg-blue-500',
              )}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-mono text-xs font-medium tabular-nums">
                  {r.codigo}
                  {r.urgente && <AlertTriangle className="size-3.5 shrink-0 text-amber-500" />}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 font-medium">{r.nombre}</p>
              <p className="mt-1 text-xs text-muted-foreground">{r.proyecto.nombre}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span className="truncate">{r.creadoPor.name}</span>
                <span className="shrink-0 font-mono tabular-nums">{fmt(r.creadoEn)}</span>
              </div>
            </div>
          </Link>
        )}
      />
    </div>
  )
}
