'use client'

import type { Proyecto } from '@/types/api'
import { NuevoRecordatorioButton } from './NuevoRecordatorioButton'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface Props {
  proyectos: Proyecto[]
  tab: 'borradores' | 'pendientes' | 'pagados' | 'fijos'
  fechaReporte: string
  onFechaReporteChange: (fecha: string) => void
  onNuevoPagoFijo?: () => void
  puedeCrearFijos?: boolean
  puedeCrearRecordatorio?: boolean
}

export function PagosPageHeader({
  proyectos,
  tab,
  onNuevoPagoFijo,
  puedeCrearFijos = true,
  puedeCrearRecordatorio = false,
}: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-1">
        {tab !== 'fijos' ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Pagos pendientes</h1>
            <p className="text-sm text-muted-foreground">
              Obligaciones por pagar, ordenadas por antigüedad.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Pagos Fijos</h1>
            <p className="text-sm text-muted-foreground">
              Registra servicios y obligaciones que se repiten. Cada mes se crea un borrador en el día de pago indicado.
            </p>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tab !== 'fijos' && puedeCrearRecordatorio ? (
          <NuevoRecordatorioButton proyectos={proyectos} />
        ) : (
          puedeCrearFijos && (
            <Button onClick={onNuevoPagoFijo}>
              <Plus className="size-4" />
              Nuevo pago fijo
            </Button>
          )
        )}
      </div>
    </div>
  )
}
