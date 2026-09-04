'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ClipboardEdit, UserX, FileText, ExternalLink } from 'lucide-react'
import { api, API_ORIGIN } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { cn, formatDateOnly } from '@/lib/utils'
import { ReceiveCotizacionForm } from './ReceiveCotizacionForm'
import type { Cotizacion, SolicitudItem, EstadoCotizacion, EstadoSolicitud, Role } from '@/types/api'

const ESTADO_LABEL: Record<EstadoCotizacion, string> = {
  pendiente: 'Pendiente',
  recibida: 'Recibida',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  sin_respuesta: 'Sin respuesta',
}

const ESTADO_CLASS: Record<EstadoCotizacion, string> = {
  pendiente: 'bg-muted text-muted-foreground',
  recibida: 'bg-amber-500/15 text-amber-600',
  aprobada: 'bg-chart-2/15 text-chart-2',
  rechazada: 'bg-destructive/10 text-destructive',
  sin_respuesta: 'bg-orange-500/15 text-orange-600',
}

function fmtUnitPrice(value: string | number) {
  const n = parseFloat(String(value))
  if (isNaN(n)) return '—'
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
}

function fmtPEN(value: string | number) {
  const n = parseFloat(String(value))
  if (isNaN(n)) return '—'
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const ROLES_GERENCIA: Role[] = ['gerencia', 'administrador', 'admin_ti']
const ROLES_EDITORES: Role[] = ['logistica', ...ROLES_GERENCIA]

interface Props {
  cotizacion: Cotizacion
  solicitudItems: SolicitudItem[]
  canApprove: boolean
  solicitudEstado: EstadoSolicitud
  role?: Role
}

export function CotizacionCard({ cotizacion, solicitudItems, canApprove, solicitudEstado, role }: Props) {
  const router = useRouter()
  const [showReceive, setShowReceive] = useState(false)
  const [approving, setApproving] = useState(false)
  const [markingNoResponse, setMarkingNoResponse] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = cotizacion.items.reduce(
    (sum, it) => sum + parseFloat(it.precioUnit) * parseFloat(it.cantidad),
    0,
  )

  const puedeRegistrarRespuesta = cotizacion.estado === 'pendiente' || cotizacion.estado === 'sin_respuesta'
  // Corregir una respuesta ya recibida/aprobada — debe coincidir con las
  // reglas de CotizacionesService.receiveCotizacion: no si ya hay OC/OS
  // generada, y solo gerencia una vez que la solicitud fue aprobada por gerencia.
  const puedeEditarRespuesta =
    (cotizacion.estado === 'recibida' || cotizacion.estado === 'aprobada') &&
    !!role && ROLES_EDITORES.includes(role) &&
    solicitudEstado !== 'orden_generada' && solicitudEstado !== 'cancelada' &&
    (solicitudEstado !== 'aprobada_gerencia' || ROLES_GERENCIA.includes(role))

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

  async function handleNoRespondio() {
    setMarkingNoResponse(true)
    setError(null)
    try {
      await api.patch(`/solicitudes-cotizacion/cotizaciones/${cotizacion.id}/sin-respuesta`, {})
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al marcar sin respuesta')
    } finally {
      setMarkingNoResponse(false)
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
          <p className="font-medium text-sm">{cotizacion.proveedor.razonSocial} <span className='text-black/60'>
            ({cotizacion.proveedor.ruc})</span></p>

          {cotizacion.creadoPor && (
            <p className="text-[13px] text-muted-foreground">
              Cotización registrada por {cotizacion.creadoPor.name}
            </p>
          )}
        </div>
        <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium shrink-0', ESTADO_CLASS[cotizacion.estado])}>
          {ESTADO_LABEL[cotizacion.estado]}
        </span>
      </div>

      {/* Items */}
      {cotizacion.estado === 'pendiente' && !showReceive && (
        <p className="text-sm text-muted-foreground font-semibold text-center border rounded-lg border-dashed py-4">Esperando respuesta del proveedor.</p>
      )}

      {cotizacion.estado === 'sin_respuesta' && !showReceive && (
        <p className="text-sm text-orange-600 py-2">El proveedor no respondió a la solicitud.</p>
      )}

      {showReceive && (puedeRegistrarRespuesta || puedeEditarRespuesta) && (
        <ReceiveCotizacionForm
          cotizacionId={cotizacion.id}
          solicitudItems={solicitudItems}
          onCancel={() => setShowReceive(false)}
          cotizacionExistente={puedeEditarRespuesta ? cotizacion : undefined}
        />
      )}

      {!showReceive && cotizacion.items.length > 0 && (
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
                  <td className="px-3 py-2 text-right font-mono tabular-nums">{fmtUnitPrice(item.precioUnit)}</td>
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

      {(cotizacion.fechaEntrega || cotizacion.validezDias || cotizacion.condicionesServicio || cotizacion.condicionesPago.length > 0 || cotizacion.condicionPago || cotizacion.nota || (cotizacion.archivos && cotizacion.archivos.length > 0)) && (
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
          {cotizacion.estado !== 'pendiente' && (
            <p>
              IGV:{' '}
              <span className="font-medium text-foreground">
                {cotizacion.incluyeIgv ? 'Incluido en los precios' : 'No incluido (se agrega en la OC)'}
              </span>
            </p>
          )}
          {cotizacion.condicionPago && (
            <p>Otras condiciones de pago: <span className="text-foreground">{cotizacion.condicionPago}</span></p>
          )}
          {cotizacion.nota && (
            <p className="italic">&ldquo;{cotizacion.nota}&rdquo;</p>
          )}
          {cotizacion.archivos && cotizacion.archivos.length > 0 && (
            <div className="pt-1.5 flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">Proforma adjunta:</span>
              {cotizacion.archivos.map((a) => (
                <a
                  key={a.id}
                  href={a.url.startsWith('http') ? a.url : `${API_ORIGIN}${a.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted hover:text-primary transition-colors duration-[120ms]"
                >
                  <FileText className="size-3.5 text-red-500" />
                  <span className="truncate max-w-[220px]">{a.nombre}</span>
                  <ExternalLink className="size-3 text-muted-foreground" />
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center place-content-end gap-2 pt-1">
        {cotizacion.estado === 'pendiente' && !showReceive && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleNoRespondio}
            disabled={markingNoResponse}
            className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
          >
            <UserX className="size-3.5" />
            {markingNoResponse ? 'Marcando…' : 'No respondió'}
          </Button>
        )}
        {cotizacion.estado === 'recibida' && canApprove && (
          <Button size="sm" onClick={handleAprobar} disabled={approving}>
            <CheckCircle2 className="size-3.5" />
            {approving ? 'Aprobando…' : 'Aprobar cotización'}
          </Button>
        )}
        {puedeEditarRespuesta && !showReceive && (
          <Button variant="outline" size="sm" onClick={() => setShowReceive(true)}>
            <ClipboardEdit className="size-3.5" />
            Editar cotización
          </Button>
        )}
        {puedeRegistrarRespuesta && !showReceive && (
          <Button variant="outline" size="sm" onClick={() => setShowReceive(true)}>
            <ClipboardEdit className="size-3.5" />
            Registrar respuesta
          </Button>
        )}
      </div>
    </div>
  )
}
