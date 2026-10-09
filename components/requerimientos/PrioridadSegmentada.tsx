'use client'

import { ChevronsUp, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PRIORIDADES, PRIORIDAD_LABEL } from '@/lib/prioridad'
import type { PrioridadRequerimiento } from '@/types/api'

interface Props {
  value: PrioridadRequerimiento
  onChange: (value: PrioridadRequerimiento) => void
  /** Id del texto que rotula el grupo (un <label> no sirve para un grupo de botones). */
  labelledBy: string
  className?: string
}

const SELECTED: Record<PrioridadRequerimiento, string> = {
  normal: 'bg-muted font-semibold text-foreground',
  alta: 'bg-amber-100 font-semibold text-amber-900',
  urgente: 'bg-destructive font-semibold text-white',
}

/** La prioridad se lee por texto e ícono, no solo por color. */
export function PrioridadSegmentada({ value, onChange, labelledBy, className }: Props) {
  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      className={cn('flex h-9 overflow-hidden rounded-lg border border-input bg-white', className)}
    >
      {PRIORIDADES.map((p) => {
        const activo = value === p
        return (
          <button
            key={p}
            type="button"
            aria-pressed={activo}
            onClick={() => onChange(p)}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 border-r border-input px-3 text-sm transition-colors duration-[120ms] last:border-r-0',
              'focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
              activo ? SELECTED[p] : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
          >
            {p === 'alta' && <ChevronsUp className="size-3.5" aria-hidden />}
            {p === 'urgente' && <Zap className="size-3.5" aria-hidden />}
            {PRIORIDAD_LABEL[p]}
          </button>
        )
      })}
    </div>
  )
}
