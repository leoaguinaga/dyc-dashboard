import { ChevronsUp, Zap } from 'lucide-react'
import { PRIORIDAD_LABEL, prioridadDe } from '@/lib/prioridad'
import type { PrioridadRequerimiento } from '@/types/api'

/** Marca compacta para listados: nada en prioridad normal; ícono con nombre accesible en alta y urgente. */
export function PrioridadMarca({ r }: { r: { prioridad?: PrioridadRequerimiento; urgente?: boolean } }) {
  const prioridad = prioridadDe(r)
  if (prioridad === 'normal') return null
  const Icono = prioridad === 'urgente' ? Zap : ChevronsUp
  return (
    <span
      title={`Prioridad ${PRIORIDAD_LABEL[prioridad].toLowerCase()}`}
      className={prioridad === 'urgente' ? 'text-destructive' : 'text-amber-600'}
    >
      <Icono className="size-3.5 shrink-0" aria-hidden />
      <span className="sr-only">Prioridad {PRIORIDAD_LABEL[prioridad].toLowerCase()}</span>
    </span>
  )
}
