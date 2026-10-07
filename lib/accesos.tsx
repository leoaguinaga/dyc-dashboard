'use client'

import { createContext, useContext } from 'react'
import type { MisModulos, ModuloKey, NivelAcceso } from '@/types/api'

export const NIVEL_LABELS: Record<NivelAcceso, string> = {
  ninguno: 'Sin acceso',
  ver: 'Ver',
  editar: 'Editar',
}

const AccesosContext = createContext<Partial<MisModulos>>({})

/**
 * Excepciones de acceso por módulo del usuario actual. Se leen una vez en el
 * layout; si cambian, se ven al recargar. El backend es el único límite real.
 */
export function AccesosProvider({
  excepciones,
  children,
}: {
  excepciones: Partial<MisModulos>
  children: React.ReactNode
}) {
  return <AccesosContext.Provider value={excepciones}>{children}</AccesosContext.Provider>
}

export function useExcepcionesModulo() {
  return useContext(AccesosContext)
}

/** Excepción configurada para el módulo, o null si manda el rol. */
export function useNivelModulo(modulo: ModuloKey): NivelAcceso | null {
  return useContext(AccesosContext)[modulo] ?? null
}

/** false solo cuando una excepción deja el módulo en solo lectura o sin acceso. */
export function usePuedeEditarModulo(modulo: ModuloKey): boolean {
  const nivel = useNivelModulo(modulo)
  return nivel === null || nivel === 'editar'
}

/** Muestra su contenido salvo que una excepción deje el módulo en solo lectura. */
export function SiPuedeEditar({
  modulo,
  children,
}: {
  modulo: ModuloKey
  children: React.ReactNode
}) {
  return usePuedeEditarModulo(modulo) ? children : null
}
