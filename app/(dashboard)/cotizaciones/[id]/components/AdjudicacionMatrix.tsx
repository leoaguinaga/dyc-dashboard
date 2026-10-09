'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/session'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ADJUDICACION_MATRIX_ID, useAdjudicacion } from './AdjudicacionProvider'
import { Check, Download, ShoppingCart, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SolicitudItem, Cotizacion, EstadoSolicitud, OrdenCompra } from '@/types/api'

interface Props {
  solicitudId: string
  solicitudItems: SolicitudItem[]
  cotizaciones: Cotizacion[]
  estado: EstadoSolicitud
  ordenesExistentes: Pick<OrdenCompra, 'id' | 'numero'>[]
}

function fmtUnitPrice(n: string | number) {
  const num = parseFloat(String(n))
  if (isNaN(num)) return '—'
  return `S/ ${num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
}

function fmt(n: string | number) {
  const num = parseFloat(String(n))
  if (isNaN(num)) return '—'
  return `S/ ${num.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const IGV_RATE = 0.18

export function AdjudicacionMatrix({ solicitudId, solicitudItems, cotizaciones, estado, ordenesExistentes }: Props) {
  const { data: session } = useSession()
  const router = useRouter()

  const role = session?.user?.role
  const canAct = role === 'administrador' || role === 'admin_ti' || role === 'logistica' || role === 'gerencia'

  const received = cotizaciones.filter((c) => c.items.length > 0)

  // ── selection state (compartida con las tarjetas de cotización) ──────────
  const { selections, setSelections } = useAdjudicacion()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (received.length === 0) return null

  // ── helpers ──────────────────────────────────────────────────────────────
  function getCotItem(cot: Cotizacion, siId: string) {
    return cot.items.find((i) => i.solicitudItemId === siId)
  }

  function getLowest(siId: string): number {
    const prices = received
      .map((c) => getCotItem(c, siId))
      .filter(Boolean)
      .map((i) => parseFloat(i!.precioUnit))
    return prices.length ? Math.min(...prices) : Infinity
  }

  const selectedCount = Object.keys(selections).length
  const itemsSinAdjudicar = solicitudItems.filter(
    (si) => !received.some((cot) => cot.items.some(
      (item) => item.solicitudItemId === si.id && item.seleccionado,
    )),
  )
  const tieneAdjudicacion = itemsSinAdjudicar.length < solicitudItems.length

  // Summary: group selected items by proveedorId
  const summary = new Map<string, { nombre: string; subtotal: number; items: { desc: string; precio: string }[] }>()
  for (const si of solicitudItems) {
    const cotItemId = selections[si.id]
    if (!cotItemId) continue
    for (const cot of received) {
      const ci = cot.items.find((i) => i.id === cotItemId)
      if (!ci) continue
      if (!summary.has(cot.proveedorId)) {
        summary.set(cot.proveedorId, { nombre: cot.proveedor.razonSocial, subtotal: 0, items: [] })
      }
      const entry = summary.get(cot.proveedorId)!
      const total = parseFloat(ci.precioUnit) * parseFloat(ci.cantidad)
      entry.subtotal += total
      entry.items.push({ desc: si.descripcion, precio: fmt(total) })
    }
  }

  const proveedoresGanadores = new Set(summary.keys())
  const cotizacionesARechazar = received.filter((c) => !proveedoresGanadores.has(c.proveedorId)).length

  // Se puede adjudicar parcialmente: los ítems sin oferta o no seleccionados
  // no deben impedir comprar los que sí fueron adjudicados.
  const puedeSeleccionar = canAct && (estado === 'cotizada' || estado === 'aprobada_gerencia')
  const puedeEditarAdjudicacion = puedeSeleccionar && !tieneAdjudicacion

  // ── actions ──────────────────────────────────────────────────────────────
  async function adjudicar() {
    setSubmitting(true)
    setErr(null)
    try {
      const adjudicaciones = Object.entries(selections).map(([solicitudItemId, cotizacionItemId]) => ({
        solicitudItemId,
        cotizacionItemId,
      }))
      await api.patch(`/solicitudes-cotizacion/${solicitudId}/adjudicar`, { adjudicaciones })
      setConfirmOpen(false)
      router.refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al adjudicar')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div id={ADJUDICACION_MATRIX_ID} className="rounded-xl border border-border bg-white p-5 space-y-5 col-span-full scroll-mt-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="size-4 text-muted-foreground" />
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Adjudicación — comparación de cotizaciones
          </h2>
        </div>
        <div className="flex items-center gap-2">
        <a
          href={`/api/cotizaciones/${solicitudId}/excel`}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
        >
          <Download className="size-3.5" />
          Exportar
        </a>
        {puedeSeleccionar ? (
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground">
              {selectedCount > 0
                ? `${selectedCount} ${selectedCount === 1 ? 'ítem adjudicado' : 'ítems adjudicados'} · los demás pueden quedar pendientes`
                : 'Selecciona al menos un ítem para adjudicar'}
            </p>
            <Button onClick={() => { setErr(null); setConfirmOpen(true) }} disabled={selectedCount === 0 || submitting} size="sm">
              {estado === 'aprobada_gerencia' ? 'Guardar adjudicación' : 'Confirmar adjudicación'}
            </Button>
          </div>
        ) : estado === 'orden_generada' ? (
          <div className="flex items-center gap-1.5 text-xs font-medium text-chart-2 bg-chart-2/10 px-2.5 py-1 rounded-md border border-chart-2/30">
            <Check className="size-3.5" />
            <span>Adjudicación completada · Órdenes generadas</span>
          </div>
        ) : null}
        </div>
      </div>

      {/* Matriz comparativa */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="text-left text-xs font-medium text-muted-foreground py-2 pr-4 border-b border-border min-w-[160px]">
                Ítem
              </th>
              {received.map((cot) => (
                <th
                  key={cot.id}
                  className="text-left text-xs font-medium text-muted-foreground py-2 px-3 border-b border-border min-w-[140px]"
                >
                  {cot.proveedor.razonSocial}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {solicitudItems.map((si) => {
              const lowest = getLowest(si.id)
              return (
                <tr key={si.id}>
                  <td className="py-2.5 pr-4 border-b border-border/60 align-top">
                    <p className="font-medium leading-tight">{si.descripcion}</p>
                    <p className="text-xs text-muted-foreground">
                      {parseFloat(si.cantidadCompra)} {si.unidad}
                    </p>
                  </td>
                  {received.map((cot) => {
                    const ci = getCotItem(cot, si.id)
                    const isSelected = selections[si.id] === ci?.id
                    const isLowest = ci && parseFloat(ci.precioUnit) === lowest
                    if (!ci) {
                      return (
                        <td key={cot.id} className="py-2.5 px-3 border-b border-border/60 text-xs text-muted-foreground/40 align-top">
                          —
                        </td>
                      )
                    }
                    const unitPrice = parseFloat(ci.precioUnit)
                    const total = unitPrice * parseFloat(ci.cantidad)
                    return (
                      <td key={cot.id} className="py-2.5 px-3 border-b border-border/60 align-top">
                        <button
                          onClick={() => puedeEditarAdjudicacion
                            ? setSelections((prev) => ({ ...prev, [si.id]: ci.id }))
                            : undefined
                          }
                          disabled={!puedeEditarAdjudicacion}
                          className={cn(
                            'w-full text-left rounded-md px-2 py-1.5 transition-all',
                            isSelected
                              ? 'bg-chart-2/10 ring-1 ring-chart-2'
                              : isLowest
                              ? 'bg-chart-2/5 hover:bg-chart-2/10 cursor-pointer'
                              : 'hover:bg-muted/60 cursor-pointer',
                            !puedeEditarAdjudicacion && 'cursor-default',
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-medium tabular-nums text-xs font-mono">{fmtUnitPrice(unitPrice)}/u</p>
                              <p className="text-xs text-muted-foreground tabular-nums">{fmt(total)}</p>
                            </div>
                            {isSelected && <Check className="size-3.5 text-chart-2 shrink-0" />}
                          </div>
                          {isLowest && (
                            <p className="text-[10px] text-chart-2 font-medium mt-0.5">Mejor precio</p>
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border bg-muted/30">
              <td className="py-2.5 pr-4 text-xs font-semibold text-foreground align-top">
                Total cotizado
              </td>
              {received.map((cot) => {
                const subtotal = cot.items.reduce(
                  (sum, ci) => sum + parseFloat(ci.precioUnit) * parseFloat(ci.cantidad),
                  0,
                )
                return (
                  <td key={cot.id} className="py-2.5 px-3 align-top">
                    <p className="font-semibold tabular-nums text-xs font-mono text-foreground">
                      {fmt(subtotal)}
                    </p>
                    {cot.incluyeIgv && <p className="mt-0.5 text-xs text-muted-foreground">IGV incluido</p>}
                  </td>
                )
              })}
            </tr>
            <tr className="bg-muted/30">
              <td className="py-1.5 pr-4 text-xs text-muted-foreground">IGV (18%)</td>
              {received.map((cot) => {
                const subtotal = cot.items.reduce(
                  (sum, ci) => sum + parseFloat(ci.precioUnit) * parseFloat(ci.cantidad),
                  0,
                )
                return (
                  <td key={cot.id} className="px-3 py-1.5 text-xs font-mono tabular-nums text-muted-foreground">
                    {cot.incluyeIgv ? '—' : fmt(subtotal * IGV_RATE)}
                  </td>
                )
              })}
            </tr>
            <tr className="border-t border-border bg-muted/50">
              <td className="py-2.5 pr-4 text-xs font-semibold text-foreground">Total con IGV</td>
              {received.map((cot) => {
                const subtotal = cot.items.reduce(
                  (sum, ci) => sum + parseFloat(ci.precioUnit) * parseFloat(ci.cantidad),
                  0,
                )
                return (
                  <td key={cot.id} className="px-3 py-2.5 text-xs font-semibold font-mono tabular-nums text-foreground">
                    {fmt(cot.incluyeIgv ? subtotal : subtotal * (1 + IGV_RATE))}
                  </td>
                )
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Resumen de adjudicación (solo previo a la generación de órdenes) */}
      {summary.size > 0 && estado !== 'orden_generada' && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Resumen — {summary.size === 1 ? '1 orden de compra' : `${summary.size} órdenes de compra`}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...summary.entries()].map(([, entry]) => (
              <div key={entry.nombre} className="rounded-md border border-border bg-white p-3 space-y-1.5">
                <p className="text-sm font-medium">{entry.nombre}</p>
                {entry.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs text-muted-foreground">
                    <span className="truncate mr-2">{item.desc}</span>
                    <span className="tabular-nums shrink-0">{item.precio}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-medium pt-1 border-t border-border">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{fmt(entry.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Órdenes ya generadas (cuando no se muestra la tarjeta dedicada de órdenes) */}
      {ordenesExistentes.length > 0 && estado !== 'orden_generada' && (
        <div className="flex flex-wrap gap-2">
          {ordenesExistentes.map((o) => (
            <a
              key={o.id}
              href={`/ordenes-compra/${o.id}`}
              className="inline-flex items-center gap-1.5 rounded-md bg-chart-2/10 px-3 py-1.5 text-xs font-medium text-chart-2 hover:bg-chart-2/20 transition-colors"
            >
              <ShoppingCart className="size-3" />
              {o.numero}
            </a>
          ))}
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={(open) => !submitting && setConfirmOpen(open)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{estado === 'aprobada_gerencia' ? 'Guardar adjudicación' : 'Confirmar adjudicación'}</DialogTitle>
            <DialogDescription>
              {estado === 'aprobada_gerencia'
                ? 'Se actualizarán los ítems adjudicados de esta solicitud.'
                : 'Las cotizaciones sin ítems adjudicados quedarán rechazadas. Puedes revertir la adjudicación mientras no exista una orden de compra.'}
            </DialogDescription>
          </DialogHeader>
          <ul className="divide-y divide-border border-y border-border text-sm">
            {[...summary.values()].map((entry) => (
              <li key={entry.nombre} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate">
                  {entry.nombre}
                  <span className="text-xs text-muted-foreground"> · {entry.items.length} {entry.items.length === 1 ? 'ítem' : 'ítems'}</span>
                </span>
                <span className="font-medium tabular-nums shrink-0">{fmt(entry.subtotal)}</span>
              </li>
            ))}
            <li className="flex items-center justify-between py-2 text-muted-foreground">
              <span>Cotizaciones que se rechazarán</span>
              <span className="tabular-nums">{cotizacionesARechazar}</span>
            </li>
            <li className="flex items-center justify-between py-2 text-muted-foreground">
              <span>Ítems sin adjudicar</span>
              <span className="tabular-nums">{solicitudItems.length - selectedCount}</span>
            </li>
          </ul>
          {err && <p role="alert" className="text-xs text-destructive">{err}</p>}
          <DialogFooter>
            <Button variant="outline" disabled={submitting} onClick={() => setConfirmOpen(false)}>Volver</Button>
            <Button disabled={submitting} onClick={() => void adjudicar()}>{submitting ? 'Guardando…' : 'Adjudicar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
