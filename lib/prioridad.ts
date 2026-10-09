import type { PrioridadRequerimiento } from '@/types/api'

export const PRIORIDADES: PrioridadRequerimiento[] = ['normal', 'alta', 'urgente']

export const PRIORIDAD_LABEL: Record<PrioridadRequerimiento, string> = {
  normal: 'Normal',
  alta: 'Alta',
  urgente: 'Urgente',
}

/**
 * Prioridad de un registro que puede venir de un borrador antiguo (solo `urgente`) o de la API
 * (`prioridad`, con `urgente` derivado de ella mientras dure la transición).
 */
export function prioridadDe(r: { prioridad?: PrioridadRequerimiento; urgente?: boolean }): PrioridadRequerimiento {
  return r.prioridad ?? (r.urgente ? 'urgente' : 'normal')
}
