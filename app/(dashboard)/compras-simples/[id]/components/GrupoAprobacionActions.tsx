'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Send } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { useSession } from '@/lib/auth/session'
import type { OrdenCompra, Role, TipoRequerimiento } from '@/types/api'

// Paso 1 (técnico), espejo de TIPO_APPROVERS_TECNICO del backend
const TIPO_APPROVERS_TECNICO: Record<TipoRequerimiento, Role[]> = {
  civil: ['ing_civil', 'administrador'],
  electrico: ['ing_electrico', 'administrador'],
  seguridad: ['jefe_sig', 'administrador'],
  administrativo: ['logistica', 'administrador'],
}

// Paso 2 (final, genera el pago)
const ROLES_APROBACION_GERENCIA: Role[] = ['gerencia', 'administrador']

interface Props {
  grupo: OrdenCompra
  creadoPorId: string
  tipo: TipoRequerimiento
}

export function GrupoAprobacionActions({ grupo: g, creadoPorId, tipo }: Props) {
  const { data: session } = useSession()
  const role = session?.user?.role as Role | undefined
  const userId = session?.user?.id
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [showObservar, setShowObservar] = useState(false)
  const [notaObservacion, setNotaObservacion] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function action(endpoint: string, body?: object) {
    setLoading(endpoint)
    setError(null)
    try {
      await api.post(`/compras-simples/grupos/${g.id}/${endpoint}`, body ?? {})
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la acción')
    } finally {
      setLoading(null)
    }
  }

  const rolesPaso =
    g.estadoAprobacion === 'pendiente' ? TIPO_APPROVERS_TECNICO[tipo]
    : g.estadoAprobacion === 'aprobada_tecnico' ? ROLES_APROBACION_GERENCIA
    : []
  const canAprobarObservar = rolesPaso.length > 0 && !!role && rolesPaso.includes(role)
  const canReenviar = g.estadoAprobacion === 'observada' && userId === creadoPorId
  const aprobarLabel = g.estadoAprobacion === 'pendiente' ? 'Aprobar (área técnica)' : 'Aprobar (gerencia)'

  if (!canAprobarObservar && !canReenviar) return null

  return (
    <div className="border-t border-border pt-3 space-y-2">
      {canAprobarObservar && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={loading !== null}
              onClick={() => action('aprobar')}
            >
              <CheckCircle2 className="size-4" />
              {loading === 'aprobar' ? 'Aprobando…' : aprobarLabel}
            </Button>
            {!showObservar && (
              <Button
                variant="outline"
                className="flex-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/5"
                disabled={loading !== null}
                onClick={() => setShowObservar(true)}
              >
                <XCircle className="size-4" />
                Observar
              </Button>
            )}
          </div>

          {showObservar && (
            <div className="space-y-2">
              <textarea
                value={notaObservacion}
                onChange={(e) => setNotaObservacion(e.target.value)}
                placeholder="¿Qué debe corregirse de este grupo? (obligatorio)…"
                rows={3}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms] resize-none"
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowObservar(false)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/5"
                  disabled={loading !== null || !notaObservacion.trim()}
                  onClick={() => action('observar', { nota: notaObservacion.trim() })}
                >
                  {loading === 'observar' ? 'Observando…' : 'Confirmar observación'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {canReenviar && (
        <Button
          variant="outline"
          className="w-full"
          disabled={loading !== null}
          onClick={() => action('reenviar')}
        >
          <Send className="size-4" />
          {loading === 'reenviar' ? 'Reenviando…' : 'Reenviar para aprobación'}
        </Button>
      )}

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
