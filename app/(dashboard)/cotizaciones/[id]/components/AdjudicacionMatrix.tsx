'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/session'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Check, ShoppingCart, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SolicitudItem, Cotizacion, EstadoSolicitud, OrdenCompra } from '@/types/api'

interface Props {
  solicitudId: string
  solicitudItems: SolicitudItem[]
  cotizaciones: Cotizacion[]
  estado: EstadoSolicitud
  ordenesExistentes: Pick<OrdenCompra, 'id' | 'numero'>[]
}

function fmt(n: string | number) {
  return `S/ ${parseFloat(String(n)).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function AdjudicacionMatrix({ solicitudId, solicitudItems, cotizaciones, estado, ordenesExistentes }: Props) {
  const { data: session } = useSession()
  const router = useRouter()

  const role = session?.user?.role
  const canAct = role === 'administrador' || role === 'logistica'

  const received = cotizaciones.filter((c) => c.items.length > 0)

  // ── selection state ──────────────────────────────────────────────────────
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const cot of received) {
      for (const item of cot.items) {
        if (item.seleccionado && item.solicitudItemId) {
          init[item.solicitudItemId] = item.id
        }
      }
    }
    return init
  })

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

  const allSelected = solicitudItems.every((si) => selections[si.id])

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

  const canAdjudicar = canAct && estado === 'cotizada' && allSelected
  const canGenerar = canAct && estado === 'aprobada_gerencia' && ordenesExistentes.length === 0 && allSelected

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
      router.refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al adjudicar')
    } finally {
      setSubmitting(false)
    }
  }

  async function generarOcs() {
    setSubmitting(true)
    setErr(null)
    try {
      const ordenes = await api.post<Pick<OrdenCompra, 'id'>[]>('/ordenes-compra', { solicitudId })
      if (ordenes.length === 1) {
        router.push(`/ordenes-compra/${ordenes[0].id}`)
      } else {
        router.refresh()
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al generar órdenes')
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-5 col-span-full">
      <div className="flex items-center gap-2">
        <Trophy className="size-4 text-muted-foreground" />
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Adjudicación — comparación de cotizaciones
        </h2>
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
                          onClick={() => canAct && estado === 'cotizada'
                            ? setSelections((prev) => ({ ...prev, [si.id]: ci.id }))
                            : undefined
                          }
                          disabled={!canAct || estado !== 'cotizada'}
                          className={cn(
                            'w-full text-left rounded-md px-2 py-1.5 transition-all',
                            isSelected
                              ? 'bg-chart-2/10 ring-1 ring-chart-2'
                              : isLowest
                              ? 'bg-chart-2/5 hover:bg-chart-2/10 cursor-pointer'
                              : 'hover:bg-muted/60 cursor-pointer',
                            (!canAct || estado !== 'cotizada') && 'cursor-default',
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-medium tabular-nums text-xs">{fmt(unitPrice)}/u</p>
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
        </table>
      </div>

      {/* Resumen de adjudicación */}
      {summary.size > 0 && (
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

      {/* Órdenes ya generadas */}
      {ordenesExistentes.length > 0 && (
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

      {/* Acciones */}
      {(canAdjudicar || canGenerar) && (
        <div className="flex items-center gap-3 pt-1">
          {canAdjudicar && (
            <Button onClick={adjudicar} disabled={submitting}>
              {submitting ? 'Guardando…' : 'Confirmar adjudicación'}
            </Button>
          )}
          {canGenerar && (
            <Button onClick={generarOcs} disabled={submitting} className="gap-2">
              <ShoppingCart className="size-4" />
              {submitting ? 'Generando…' : summary.size === 1 ? 'Generar orden de compra' : `Generar ${summary.size} órdenes de compra`}
            </Button>
          )}
          {!allSelected && (
            <p className="text-xs text-muted-foreground">
              Selecciona un proveedor para cada ítem para continuar
            </p>
          )}
          {err && <p className="text-xs text-destructive">{err}</p>}
        </div>
      )}
    </div>
  )
}
