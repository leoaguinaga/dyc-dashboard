'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, CheckCircle2, PackageCheck, AlertTriangle } from 'lucide-react'
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
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { OrdenCompra } from '@/types/api'

interface Props {
  oc: OrdenCompra
}

export function OrdenCompraActions({ oc }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recibirOpen, setRecibirOpen] = useState(false)
  const [cancelarOpen, setCancelarOpen] = useState(false)
  const [fechaEntregaReal, setFechaEntregaReal] = useState(() => new Date().toISOString().slice(0, 10))
  const [calificacionCalidad, setCalificacionCalidad] = useState(0)

  const role = session?.user?.role
  const canAct = role === 'administrador' || role === 'admin_ti' || role === 'logistica' || role === 'gerencia'

  async function advance() {
    if (oc.estado === 'emitida' || oc.estado === 'recibida_parcial') {
      setRecibirOpen(true)
      return
    }
    if (oc.estado === 'borrador') {
      setLoading(true)
      setError(null)
      try {
        await api.post(`/ordenes-compra/${oc.id}/emitir`, {})
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al emitir la orden')
      } finally {
        setLoading(false)
      }
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

  async function ejecutarCancelacion() {
    setLoading(true)
    setError(null)
    try {
      await api.post(`/ordenes-compra/${oc.id}/cancelar`, {})
      setCancelarOpen(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cancelar la orden')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
      {canAct && oc.estado === 'borrador' && (
        <Button
          onClick={advance}
          disabled={loading}
          size="sm"
        >
          {loading ? 'Procesando…' : 'Emitir orden'}
        </Button>
      )}

      {canAct && (oc.estado === 'emitida' || oc.estado === 'recibida_parcial') && (
        <Button
          onClick={advance}
          disabled={loading}
          size="sm"
        >
          {loading ? 'Procesando…' : 'Registrar recepción completa'}
        </Button>
      )}

      {canAct && oc.estado !== 'cancelada' && oc.estado !== 'recibida' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCancelarOpen(true)}
          disabled={loading}
          className="text-destructive hover:text-destructive hover:bg-destructive/5"
        >
          Cancelar orden
        </Button>
      )}

      {oc.estado === 'recibida' && (
        <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 text-emerald-600" />
          Orden recibida completamente.
        </p>
      )}

      {oc.estado === 'cancelada' && (
        <p className="text-xs text-destructive font-medium">Esta orden fue cancelada.</p>
      )}

      {error && <p className="text-xs text-destructive w-full">{error}</p>}

      {/* Modal de recepción en obra */}
      <Dialog open={recibirOpen} onOpenChange={setRecibirOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <PackageCheck className="size-5 text-emerald-600" />
              Confirmar Recepción de Mercadería
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Certifica que los materiales fueron entregados e inspeccionados en la obra.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Fecha de entrega real en obra *
              </label>
              <Input
                type="date"
                value={fechaEntregaReal}
                onChange={(e) => setFechaEntregaReal(e.target.value)}
                className="h-10 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-foreground">
                Calificación de calidad del proveedor (opcional)
              </label>
              <div className="flex items-center gap-1.5 bg-muted/40 p-2.5 rounded-lg border border-border/60">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCalificacionCalidad(n === calificacionCalidad ? 0 : n)}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    title={`${n} estrellas`}
                  >
                    <Star
                      className={cn(
                        'size-6 transition-colors',
                        n <= calificacionCalidad ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30',
                      )}
                    />
                  </button>
                ))}
                <span className="text-xs text-muted-foreground ml-2">
                  {calificacionCalidad > 0 ? `${calificacionCalidad} de 5 estrellas` : 'Sin calificar'}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setRecibirOpen(false)} disabled={loading} className="h-10">
              Volver
            </Button>
            <Button onClick={confirmarRecepcion} disabled={loading} className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              {loading ? 'Guardando…' : 'Confirmar Recepción Completa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para cancelar orden */}
      <Dialog open={cancelarOpen} onOpenChange={setCancelarOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              ¿Estás seguro de cancelar esta orden?
            </DialogTitle>
            <DialogDescription className="text-xs text-foreground/80 mt-1">
              Esta acción dará de baja la orden formal <strong className="font-mono text-foreground">{oc.numero}</strong>. Los pagos programados y la recepción quedarán sin efecto.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button variant="outline" onClick={() => setCancelarOpen(false)} disabled={loading} className="h-10">
              No, regresar
            </Button>
            <Button onClick={ejecutarCancelacion} disabled={loading} variant="destructive" className="h-10 font-semibold">
              {loading ? 'Cancelando…' : 'Sí, cancelar orden'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

