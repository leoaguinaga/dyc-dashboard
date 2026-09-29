'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { Pago } from '@/types/api'
import { getDestinoPago } from '@/lib/pagos-utils'
import { useSession } from '@/lib/auth/session'
import { MetodoPagoSelect } from '../../components/MetodoPagoSelect'

function hoyISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function MarcarPagadoCard({ pago }: { pago: Pago }) {
  const { data: session } = useSession()
  const puedePagar = ['administrador', 'gerencia', 'admin_ti'].includes(session?.user?.role ?? '')
  const router = useRouter()
  const destino = getDestinoPago(pago)

  const metodoInicial = pago.metodoPago || (
    destino.billetera
      ? 'Yape/Plin'
      : destino.bancoNorm && destino.bancoNorm !== 'Sin banco'
        ? `Transferencia ${destino.bancoNorm}`
        : 'Transferencia BCP'
  )

  const [fechaPagoReal, setFechaPagoReal] = useState(hoyISO)
  const [metodoPago, setMetodoPago] = useState(metodoInicial)
  const [confirmarCancelar, setConfirmarCancelar] = useState(false)
  const [numeroOperacion, setNumeroOperacion] = useState('')
  const [saving, setSaving] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!puedePagar) return null

  async function marcarPagado() {
    setSaving(true)
    setError(null)
    try {
      await api.post(`/pagos/${pago.id}/marcar-pagado`, {
        fechaPagoReal,
        metodoPago: metodoPago.trim() || undefined,
        numeroOperacion: numeroOperacion.trim() || undefined,
      })
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al marcar como pagado')
      setSaving(false)
    }
  }

  async function cancelarPago() {
    setCancelando(true)
    setError(null)
    try {
      await api.post(`/pagos/${pago.id}/cancelar`, {})
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cancelar el pago')
      setCancelando(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-4 shadow-xs">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Liquidación de Pago
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ingresa los datos bancarios para registrar el desembolso de esta obligación.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">Fecha de pago real</label>
          <Input
            type="date"
            value={fechaPagoReal}
            onChange={(e) => setFechaPagoReal(e.target.value)}
            className="h-9 text-xs"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-foreground">Método de pago ejecutado</label>
          <MetodoPagoSelect
            value={metodoPago}
            onChange={setMetodoPago}
            bancoSugerido={destino.bancoNorm !== 'Sin banco' ? destino.bancoNorm : undefined}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-foreground">
            N° de operación bancaria (opcional)
          </label>
          <Input
            value={numeroOperacion}
            onChange={(e) => setNumeroOperacion(e.target.value)}
            className="h-9 text-xs font-mono"
            placeholder="Ej. 08291482"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2 justify-between">
        <Button
          variant="outline"
          onClick={() => setConfirmarCancelar(true)}
          disabled={saving || cancelando}
        >
          {cancelando ? 'Cancelando...' : 'Cancelar pago'}
        </Button>
        <Button
          onClick={marcarPagado}
          disabled={saving || cancelando}
        >
          {saving ? 'Guardando...' : 'Confirmar pago'}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmarCancelar}
        onOpenChange={setConfirmarCancelar}
        title="Cancelar pago"
        description="El pago quedará cancelado y no requerirá desembolso. Esta acción no se puede deshacer."
        confirmLabel="Cancelar pago"
        cancelLabel="Volver"
        destructive
        loading={cancelando}
        onConfirm={cancelarPago}
      />
    </div>
  )
}
