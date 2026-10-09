'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { Cotizacion } from '@/types/api'

/** Id del bloque de la matriz; las tarjetas de cotización desplazan la vista hasta aquí. */
export const ADJUDICACION_MATRIX_ID = 'adjudicacion-matrix'

interface AdjudicacionContextValue {
  /** solicitudItemId → cotizacionItemId elegido. */
  selections: Record<string, string>
  setSelections: React.Dispatch<React.SetStateAction<Record<string, string>>>
  /** Cotización cuyos ítems se preseleccionaron con "Adjudicar todo"; null si la elección es mixta. */
  proveedorPreseleccionado: string | null
  preseleccionarProveedor: (cotizacion: Cotizacion) => void
}

const AdjudicacionContext = createContext<AdjudicacionContextValue | null>(null)

function seleccionInicial(cotizaciones: Cotizacion[]) {
  const init: Record<string, string> = {}
  for (const cot of cotizaciones) {
    for (const item of cot.items) {
      if (item.seleccionado && item.solicitudItemId) init[item.solicitudItemId] = item.id
    }
  }
  return init
}

/**
 * Comparte la selección de la matriz con las tarjetas de cotización: "Adjudicar todo a este
 * proveedor" solo preselecciona; la única acción que guarda es "Confirmar adjudicación".
 */
export function AdjudicacionProvider({
  cotizaciones,
  children,
}: {
  cotizaciones: Cotizacion[]
  children: React.ReactNode
}) {
  const [selections, setSelections] = useState(() => seleccionInicial(cotizaciones))
  const [proveedorPreseleccionado, setProveedorPreseleccionado] = useState<string | null>(null)

  const preseleccionarProveedor = useCallback((cotizacion: Cotizacion) => {
    const next: Record<string, string> = {}
    for (const item of cotizacion.items) {
      if (item.solicitudItemId) next[item.solicitudItemId] = item.id
    }
    setSelections(next)
    setProveedorPreseleccionado(cotizacion.id)
  }, [])

  const value = useMemo<AdjudicacionContextValue>(
    () => ({
      selections,
      setSelections: (action) => {
        // Cualquier cambio manual en la matriz deja de ser "todo de un proveedor".
        setProveedorPreseleccionado(null)
        setSelections(action)
      },
      proveedorPreseleccionado,
      preseleccionarProveedor,
    }),
    [selections, proveedorPreseleccionado, preseleccionarProveedor],
  )

  return <AdjudicacionContext.Provider value={value}>{children}</AdjudicacionContext.Provider>
}

export function useAdjudicacion() {
  const ctx = useContext(AdjudicacionContext)
  if (!ctx) throw new Error('useAdjudicacion debe usarse dentro de AdjudicacionProvider')
  return ctx
}
