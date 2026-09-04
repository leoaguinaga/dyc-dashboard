import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  TIPO_LABEL,
  TIPO_CLASS,
  TIPO_COLOR,
} from '../../requerimientos/components/RequerimientosTableClient'
import type { TipoRequerimiento } from '@/types/api'

const TIPOS: TipoRequerimiento[] = ['civil', 'electrico', 'seguridad', 'administrativo']

interface CotizacionesLeyendProps {
  className?: string
  onScrollLeft?: () => void
  onScrollRight?: () => void
}

export function CotizacionesLeyend({
  className,
  onScrollLeft,
  onScrollRight,
}: CotizacionesLeyendProps) {
  return (
    <div className={cn('flex items-center justify-between gap-2', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={onScrollLeft}
        aria-label="Desplazar kanban a la izquierda"
        className="shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="flex flex-wrap items-center justify-center gap-2 flex-1">
        {TIPOS.map((tipo) => (
          <span
            key={tipo}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium',
              TIPO_CLASS[tipo],
            )}
          >
            <span className={cn('size-2 rounded-full shrink-0', TIPO_COLOR[tipo])} />
            {TIPO_LABEL[tipo]}
          </span>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        onClick={onScrollRight}
        aria-label="Desplazar kanban a la derecha"
        className="shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}

export default CotizacionesLeyend
