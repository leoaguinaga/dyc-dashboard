import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EstadoOrdenCompra } from '@/types/api'

// La recepción parcial aún no está confirmada como paso del flujo: no se muestra. Una orden en ese
// estado se ubica en "Emitida" (su badge sigue diciendo "Recepción parcial").
const PASOS: { estado: 'borrador' | 'emitida' | 'recibida'; label: string }[] = [
  { estado: 'borrador', label: 'Borrador' },
  { estado: 'emitida', label: 'Emitida' },
  { estado: 'recibida', label: 'Recibida' },
]

/** Línea mínima del avance de la orden. Una orden cancelada no muestra avance. */
export function EstadoProgreso({ estado }: { estado: EstadoOrdenCompra }) {
  if (estado === 'cancelada') return null
  const estadoPaso = estado === 'recibida_parcial' ? 'emitida' : estado
  const actual = PASOS.findIndex((p) => p.estado === estadoPaso)

  return (
    <ol aria-label="Avance de la orden" className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
      {PASOS.map((paso, i) => {
        const hecho = i < actual
        const esActual = i === actual
        return (
          <li key={paso.estado} className="flex items-center gap-1.5" aria-current={esActual ? 'step' : undefined}>
            {i > 0 && <span aria-hidden="true" className={cn('h-px w-4', hecho || esActual ? 'bg-primary/50' : 'bg-border')} />}
            <span
              className={cn(
                'inline-flex items-center gap-1',
                esActual ? 'font-medium text-foreground' : hecho ? 'text-muted-foreground' : 'text-muted-foreground/80',
              )}
            >
              {hecho ? (
                <Check className="size-3 text-primary" aria-hidden="true" />
              ) : (
                <span
                  aria-hidden="true"
                  className={cn('size-2 rounded-full border', esActual ? 'border-primary bg-primary' : 'border-muted-foreground/40')}
                />
              )}
              {paso.label}
              <span className="sr-only">{hecho ? ' (completado)' : esActual ? ' (estado actual)' : ' (pendiente)'}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
