'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ClipboardEdit } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { cn, formatDateOnly } from '@/lib/utils'
import { ReceiveCotizacionForm } from './ReceiveCotizacionForm'
import type { Cotizacion, SolicitudItem, EstadoCotizacion } from '@/types/api'

const ESTADO_LABEL: Record<EstadoCotizacion, string> = {
  pendiente: 'Pendiente',
  recibida: 'Recibida',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
}

const ESTADO_CLASS: Record<EstadoCotizacion, string> = {
  pendiente: 'bg-muted text-muted-foreground',
  recibida: 'bg-amber-500/15 text-amber-600',
  aprobada: 'bg-chart-2/15 text-chart-2',
  rechazada: 'bg-destructive/10 text-destructive',
}

function fmtPEN(value: string | number) {
  return `S/ ${parseFloat(String(value)).toFixed(2)}`
}

interface Props {
  cotizacion: Cotizacion
  solicitudItems: SolicitudItem[]
  canApprove: boolean
}

export function CotizacionCard({ cotizacion, solicitudItems, canApprove }: Props) {
  const router = useRouter()
  const [showReceive, setShowReceive] = useState(false)
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = cotizacion.items.reduce(
    (sum, it) => sum + parseFloat(it.precioUnit) * parseFloat(it.cantidad),
    0,
  )

  async function handleAprobar() {
    setApproving(true)
    setError(null)
    try {
      await api.patch(`/solicitudes-cotizacion/cotizaciones/${cotizacion.id}/aprobar`, {})
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar')
    } finally {
      setApproving(false)
    }
  }

  return (
    <div className={cn(
      'rounded-xl border bg-white p-4 space-y-3 transition-colors duration-[120ms]',
      cotizacion.estado === 'aprobada' && 'border-chart-2/30 bg-chart-2/5',
      cotizacion.estado === 'rechazada' && 'opacity-50',
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-sm">{cotizacion.proveedor.razonSocial}</p>
          <p className="text-xs text-muted-foreground font-mono">{cotizacion.proveedor.ruc}</p>
        </div>
        <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium shrink-0', ESTADO_CLASS[cotizacion.estado])}>
          {ESTADO_LABEL[cotizacion.estado]}
        </span>
      </div>

      {/* Items */}
      {cotizacion.estado === 'pendiente' && !showReceive && (
        <p className="text-sm text-muted-foreground py-2">Esperando respuesta del proveedor.</p>
      )}

      {showReceive && cotizacion.estado === 'pendiente' && (
        <ReceiveCotizacionForm
          cotizacionId={cotizacion.id}
          solicitudItems={solicitudItems}
          onCancel={() => setShowReceive(false)}
        />
      )}

      {cotizacion.items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Descripción</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Precio unit.</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Cant.</th>
                <th className="px-3 py-2 text-right font-medium text-muted-foreground">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cotizacion.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2">
                    {item.descripcionProveedor}
                    {item.item && (
                      <span className="block text-muted-foreground/70 font-mono text-[10px]">
                        → {item.item.nombre}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{fmtPEN(item.precioUnit)}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {parseFloat(item.cantidad).toFixed(2)} {item.unidad}
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums font-medium">
                    {fmtPEN(parseFloat(item.precioUnit) * parseFloat(item.cantidad))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-muted/30">
                <td colSpan={3} className="px-3 py-2 text-right text-xs font-medium">Total</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums font-semibold">{fmtPEN(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {(cotizacion.fechaEntrega || cotizacion.validezDias || cotizacion.condicionesServicio || cotizacion.condicionesPago.length > 0 || cotizacion.condicionPago || cotizacion.nota) && (
        <div className="space-y-1 text-xs text-muted-foreground border-t border-border pt-2">
          {cotizacion.fechaEntrega && (
            <p>Entrega: <span className="font-medium text-foreground">{formatDateOnly(cotizacion.fechaEntrega)}</span></p>
          )}
          {cotizacion.validezDias && (
            <p>Validez: <span className="font-medium text-foreground">{cotizacion.validezDias} días</span></p>
          )}
          {cotizacion.condicionesServicio && (
            <p>Condiciones: <span className="text-foreground">{cotizacion.condicionesServicio}</span></p>
          )}
          {cotizacion.condicionesPago.length > 0 && (
            <p>
              Forma de pago:{' '}
              <span className="font-medium text-foreground">
                {cotizacion.condicionesPago
                  .map((c) => `${c.porcentaje}% (${formatDateOnly(c.fecha)})`)
                  .join(' + ')}
              </span>
            </p>
          )}
          {cotizacion.condicionPago && (
            <p>Otras condiciones de pago: <span className="text-foreground">{cotizacion.condicionPago}</span></p>
          )}
          {cotizacion.nota && (
            <p className="italic">&ldquo;{cotizacion.nota}&rdquo;</p>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        {cotizacion.estado === 'pendiente' && !showReceive && (
          <Button variant="outline" size="sm" onClick={() => setShowReceive(true)}>
            <ClipboardEdit className="size-3.5" />
            Registrar respuesta
          </Button>
        )}
        {cotizacion.estado === 'recibida' && canApprove && (
          <Button size="sm" onClick={handleAprobar} disabled={approving}>
            <CheckCircle2 className="size-3.5" />
            {approving ? 'Aprobando…' : 'Aprobar cotización'}
          </Button>
        )}
      </div>
    </div>
  )
}
