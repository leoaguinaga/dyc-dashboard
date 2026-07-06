'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/session'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import type { EstadoSolicitud, Role, SolicitudCotizacion } from '@/types/api'

interface Props {
  solicitud: Pick<SolicitudCotizacion, 'id' | 'estado'>
}

const TRANSICION: Partial<Record<EstadoSolicitud, { label: string; endpoint: string; rolesPermitidos: Role[] }>> = {
  seleccionada: {
    label: 'Aprobar (solicitante)',
    endpoint: 'aprobar-solicitante',
    rolesPermitidos: ['administrador', 'logistica'],
  },
  aprobada_solicitante: {
    label: 'Aprobar gerencia',
    endpoint: 'aprobar-gerencia',
    rolesPermitidos: ['administrador', 'gerencia'],
  },
}

export function SolicitudActions({ solicitud }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const role = session?.user?.role

  const accion = TRANSICION[solicitud.estado]
  const puedeCancelar =
    role === 'administrador' &&
    solicitud.estado !== 'aprobada_gerencia' &&
    solicitud.estado !== 'cancelada'

  const puedeAvanzar = accion && role && accion.rolesPermitidos.includes(role)

  if (!puedeAvanzar && !puedeCancelar) return null

  async function avanzar(endpoint: string) {
    setLoading(true)
    setError(null)
    try {
      await api.post(`/solicitudes-cotizacion/${solicitud.id}/${endpoint}`, {})
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar estado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {puedeAvanzar && (
        <Button
          size="sm"
          onClick={() => avanzar(accion.endpoint)}
          disabled={loading}
        >
          {loading ? 'Procesando…' : accion.label}
        </Button>
      )}
      {puedeCancelar && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => avanzar('cancelar')}
          disabled={loading}
          className="text-destructive hover:text-destructive hover:bg-destructive/5"
        >
          Cancelar solicitud
        </Button>
      )}
      {error && <p className="w-full text-xs text-destructive">{error}</p>}
    </div>
  )
}
