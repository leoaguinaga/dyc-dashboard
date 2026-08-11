'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Pago } from '@/types/api'

function hoyISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function MarcarPagadoCard({ pago }: { pago: Pago }) {
  const router = useRouter()
  const [fechaPagoReal, setFechaPagoReal] = useState(hoyISO)
  const [metodoPago, setMetodoPago] = useState(pago.metodoPago ?? '')
  const [numeroOperacion, setNumeroOperacion] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-4">
      <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Marcar como pagado</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Fecha de pago</label>
          <Input type="date" value={fechaPagoReal} onChange={(e) => setFechaPagoReal(e.target.value)} className="h-9 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Método de pago</label>
          <Input value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="h-9 text-sm" placeholder="Transferencia, efectivo…" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">N° de operación</label>
          <Input value={numeroOperacion} onChange={(e) => setNumeroOperacion(e.target.value)} className="h-9 text-sm" placeholder="Opcional" />
        </div>
      </div>
      <Button onClick={marcarPagado} disabled={saving}>
        <Check className="size-3.5" />
        {saving ? 'Guardando…' : 'Marcar como pagado'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
