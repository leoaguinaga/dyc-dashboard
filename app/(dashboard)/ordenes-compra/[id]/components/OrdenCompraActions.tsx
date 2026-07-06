'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/session'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import type { OrdenCompra, Role } from '@/types/api'

interface Props {
  oc: OrdenCompra
}

const NEXT_LABEL: Partial<Record<string, string>> = {
  borrador: 'Emitir orden',
  emitida: 'Registrar recepción parcial',
  recibida_parcial: 'Registrar recepción completa',
}

const NEXT_ENDPOINT: Partial<Record<string, string>> = {
  borrador: 'emitir',
  emitida: 'recibir-parcial',
  recibida_parcial: 'recibir',
}

export function OrdenCompraActions({ oc }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const role = session?.user?.role
  const canAct = role === 'administrador' || role === 'logistica'

  const nextLabel = NEXT_LABEL[oc.estado]
  const nextEndpoint = NEXT_ENDPOINT[oc.estado]

  async function advance() {
    if (!nextEndpoint) return
    setLoading(true)
    setError(null)
    try {
      await api.post(`/ordenes-compra/${oc.id}/${nextEndpoint}`, {})
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar estado')
    } finally {
      setLoading(false)
    }
  }

  async function cancel() {
    setLoading(true)
    setError(null)
    try {
      await api.post(`/ordenes-compra/${oc.id}/cancelar`, {})
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cancelar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
      {!canAct || (!nextLabel && oc.estado !== 'cancelada' && oc.estado !== 'recibida') ? (
        <p className="text-xs text-muted-foreground">Sin acciones disponibles.</p>
      ) : null}

      {canAct && nextLabel && nextEndpoint && (
        <Button onClick={advance} disabled={loading}>
          {loading ? 'Procesando…' : nextLabel}
        </Button>
      )}

      {canAct && oc.estado !== 'cancelada' && oc.estado !== 'recibida' && (
        <Button variant="outline" onClick={cancel} disabled={loading} className="text-destructive hover:text-destructive hover:bg-destructive/5">
          Cancelar orden
        </Button>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {oc.estado === 'recibida' && (
        <p className="text-xs text-chart-2 font-medium">Orden recibida completamente.</p>
      )}
      {oc.estado === 'cancelada' && (
        <p className="text-xs text-destructive font-medium">Esta orden fue cancelada.</p>
      )}
    </div>
  )
}
