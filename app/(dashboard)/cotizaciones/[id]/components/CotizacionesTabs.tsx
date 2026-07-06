'use client'

import { useState } from 'react'
import { Check, UserX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CotizacionCard } from './CotizacionCard'
import type { Cotizacion, SolicitudItem } from '@/types/api'

interface Props {
  cotizaciones: Cotizacion[]
  solicitudItems: SolicitudItem[]
  canApprove: boolean
}

export function CotizacionesTabs({ cotizaciones, solicitudItems, canApprove }: Props) {
  const [activeId, setActiveId] = useState(cotizaciones[0]?.id)
  const active = cotizaciones.find((c) => c.id === activeId) ?? cotizaciones[0]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {cotizaciones.map((cot) => {
          const respondida = cot.estado !== 'pendiente' && cot.estado !== 'sin_respuesta'
          const sinRespuesta = cot.estado === 'sin_respuesta'
          const isActive = cot.id === active.id
          return (
            <button
              key={cot.id}
              type="button"
              onClick={() => setActiveId(cot.id)}
              className={cn(
                'group flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all duration-[120ms]',
                respondida && 'border-chart-2/40 bg-chart-2/10 hover:bg-chart-2/15',
                sinRespuesta && 'border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/15',
                !respondida && !sinRespuesta && 'border-border bg-muted/40 hover:bg-muted/70',
                isActive && respondida && 'ring-2 ring-chart-2/50 border-chart-2',
                isActive && sinRespuesta && 'ring-2 ring-orange-500/50 border-orange-500',
                isActive && !respondida && !sinRespuesta && 'ring-2 ring-foreground/20 border-foreground/30 bg-white',
              )}
            >
              <span
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center rounded-full',
                  respondida && 'bg-chart-2 text-white',
                  sinRespuesta && 'bg-orange-500 text-white',
                  !respondida && !sinRespuesta && 'bg-white border border-border',
                )}
              >
                {respondida && <Check className="size-2.5" strokeWidth={3} />}
                {sinRespuesta && <UserX className="size-2.5" strokeWidth={3} />}
              </span>
              <span className="flex flex-col">
                <span className={cn('text-xs font-medium leading-tight', isActive ? 'text-foreground' : 'text-foreground/80')}>
                  {cot.proveedor.razonSocial}
                </span>
                <span className="text-[10px] font-mono leading-tight text-muted-foreground">
                  {cot.proveedor.ruc}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {active && (
        <CotizacionCard
          key={active.id}
          cotizacion={active}
          solicitudItems={solicitudItems}
          canApprove={canApprove}
        />
      )}
    </div>
  )
}
