'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertTriangle } from 'lucide-react'
import { useSession } from '@/lib/auth/session'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import type { OrdenCompra } from '@/types/api'

interface Props {
  oc: OrdenCompra
}

export function OrdenCompraActions({ oc }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelarOpen, setCancelarOpen] = useState(false)

  const role = session?.user?.role
  const canAct = role === 'administrador' || role === 'admin_ti' || role === 'logistica' || role === 'gerencia'

  async function advance() {
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
          Recepción confirmada por el solicitante.
        </p>
      )}

      {oc.estado === 'cancelada' && (
        <p className="text-xs text-destructive font-medium">Esta orden fue cancelada.</p>
      )}

      {error && <p className="text-xs text-destructive w-full">{error}</p>}

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

