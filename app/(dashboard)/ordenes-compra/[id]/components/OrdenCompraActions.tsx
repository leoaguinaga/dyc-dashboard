'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
import { useSession } from '@/lib/auth/session'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
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
  const [recibirOpen, setRecibirOpen] = useState(false)
  const [fechaEntregaReal, setFechaEntregaReal] = useState(() => new Date().toISOString().slice(0, 10))
  const [calificacionCalidad, setCalificacionCalidad] = useState(0)

  const role = session?.user?.role
  const canAct = role === 'administrador' || role === 'logistica'

  const nextLabel = NEXT_LABEL[oc.estado]
  const nextEndpoint = NEXT_ENDPOINT[oc.estado]

  async function advance() {
    if (!nextEndpoint) return
    if (nextEndpoint === 'recibir') {
      setRecibirOpen(true)
      return
    }
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

  async function confirmarRecepcion() {
    setLoading(true)
    setError(null)
    try {
      await api.post(`/ordenes-compra/${oc.id}/recibir`, {
        fechaEntregaReal,
        calificacionCalidad: calificacionCalidad > 0 ? calificacionCalidad : undefined,
      })
      setRecibirOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar la recepción')
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

      <Dialog open={recibirOpen} onOpenChange={setRecibirOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar recepción completa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Fecha de entrega real</label>
              <Input
                type="date"
                value={fechaEntregaReal}
                onChange={(e) => setFechaEntregaReal(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Calificación de calidad (opcional)</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCalificacionCalidad(n === calificacionCalidad ? 0 : n)}
                    className="p-0.5"
                  >
                    <Star
                      className={cn(
                        'size-5 transition-colors',
                        n <= calificacionCalidad ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40',
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecibirOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={confirmarRecepcion} disabled={loading}>
              {loading ? 'Guardando…' : 'Confirmar recepción'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
