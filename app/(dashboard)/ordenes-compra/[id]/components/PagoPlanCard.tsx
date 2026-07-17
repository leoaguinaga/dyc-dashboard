'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Check, X, Trash2, AlertTriangle } from 'lucide-react'
import { useSession } from '@/lib/auth/session'
import { api } from '@/lib/api/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency, formatDateOnly, formatPercent } from '@/lib/utils'
import type { OrdenCompra, Pago } from '@/types/api'

interface Props {
  oc: OrdenCompra
  pagos: Pago[]
}

const ESTADO_LABEL: Record<Pago['estadoEfectivo'], string> = {
  pendiente: 'Pendiente',
  vencido: 'Vencido',
  pagado: 'Pagado',
  cancelado: 'Cancelado',
}

const ESTADO_CLASS: Record<Pago['estadoEfectivo'], string> = {
  pendiente: 'bg-muted text-muted-foreground',
  vencido: 'bg-destructive/10 text-destructive',
  pagado: 'bg-chart-2/10 text-chart-2',
  cancelado: 'bg-muted text-muted-foreground/60',
}

const fmtDate = formatDateOnly

export function PagoPlanCard({ oc, pagos: initialPagos }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const role = session?.user?.role
  const canManage = role === 'administrador' || role === 'logistica' || role === 'gerencia'

  const [pagos, setPagos] = useState(initialPagos)
  const [adding, setAdding] = useState(false)
  const [porcentaje, setPorcentaje] = useState('')
  const [fechaProgramada, setFechaProgramada] = useState('')
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)

  const activos = pagos.filter((p) => p.estado !== 'cancelado')
  const porcentajePlanificado = activos.reduce((s, p) => s + Number(p.porcentaje), 0)
  const porcentajeDisponible = Math.max(0, 100 - porcentajePlanificado)
  const totalPlanificado = activos.reduce((s, p) => s + Number(p.monto), 0)
  const cubre100 = Math.abs(porcentajePlanificado - 100) < 0.01

  async function refresh() {
    const data = await api.get<Pago[]>(`/pagos/orden/${oc.id}`)
    setPagos(data)
  }

  function prefill(pct: number) {
    setPorcentaje(String(Math.min(pct, porcentajeDisponible)))
    setAdding(true)
  }

  async function crearPago() {
    const pct = Number(porcentaje)
    if (!porcentaje || pct <= 0) { setError('El porcentaje debe ser mayor a 0'); return }
    if (pct > porcentajeDisponible + 0.01) { setError(`Máximo disponible: ${porcentajeDisponible.toFixed(2)}%`); return }
    if (!fechaProgramada) { setError('La fecha programada es requerida'); return }
    setSaving(true)
    setError(null)
    try {
      await api.post('/pagos', {
        ordenCompraId: oc.id,
        porcentaje: pct,
        fechaProgramada,
        nota: nota.trim() || undefined,
      })
      setPorcentaje(''); setFechaProgramada(''); setNota(''); setAdding(false)
      await refresh()
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al registrar el pago')
    } finally {
      setSaving(false)
    }
  }

  async function marcarPagado(id: string) {
    setPayingId(id)
    setError(null)
    try {
      await api.post(`/pagos/${id}/marcar-pagado`, {})
      await refresh()
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al marcar como pagado')
    } finally {
      setPayingId(null)
    }
  }

  async function cancelarPago(id: string) {
    setPayingId(id)
    setError(null)
    try {
      await api.post(`/pagos/${id}/cancelar`, {})
      await refresh()
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cancelar el pago')
    } finally {
      setPayingId(null)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white overflow-x-auto">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Plan de pagos</h2>
        {canManage && porcentajeDisponible > 0.01 && (
          <div className="flex items-center gap-2">
            {oc.adelantoPorcentaje && (
              <button onClick={() => prefill(Number(oc.adelantoPorcentaje))} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                + Adelanto ({formatPercent(oc.adelantoPorcentaje)})
              </button>
            )}
            {oc.saldoPorcentaje && (
              <button onClick={() => prefill(Number(oc.saldoPorcentaje))} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                + Saldo ({formatPercent(oc.saldoPorcentaje)})
              </button>
            )}
            {!adding && (
              <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Plus className="size-3.5" />
                Agregar tramo
              </button>
            )}
          </div>
        )}
      </div>

      {pagos.length === 0 && !adding && (
        <p className="px-5 py-4 text-sm text-muted-foreground">Sin pagos programados aún.</p>
      )}

      {pagos.length > 0 && (
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Fecha</th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">%</th>
              <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Monto</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Estado</th>
              <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Nota</th>
              {canManage && <th className="px-4 py-2.5 w-24" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pagos.map((p) => (
              <tr key={p.id} className="group">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {p.estadoEfectivo === 'vencido' && <AlertTriangle className="size-3.5 text-destructive" />}
                    {fmtDate(p.fechaProgramada)}
                  </div>
                  {p.fechaPagoReal && (
                    <div className="text-xs text-muted-foreground">Pagado {fmtDate(p.fechaPagoReal)}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">{formatPercent(p.porcentaje)}</td>
                <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatCurrency(p.monto)}</td>
                <td className="px-4 py-3">
                  <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', ESTADO_CLASS[p.estadoEfectivo])}>
                    {ESTADO_LABEL[p.estadoEfectivo]}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{p.nota ?? '—'}</td>
                {canManage && (
                  <td className="px-2 py-3">
                    {(p.estado === 'pendiente') && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => marcarPagado(p.id)}
                          disabled={payingId === p.id}
                          title="Marcar como pagado"
                          className="flex size-7 items-center justify-center rounded text-chart-2 hover:bg-chart-2/10"
                        >
                          <Check className="size-3.5" />
                        </button>
                        <button
                          onClick={() => cancelarPago(p.id)}
                          disabled={payingId === p.id}
                          title="Cancelar"
                          className="flex size-7 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-border bg-muted/20">
            <tr>
              <td className="px-4 py-3 text-right text-sm font-medium">Planificado</td>
              <td className="px-4 py-3 text-right tabular-nums font-bold">{porcentajePlanificado.toFixed(2)}%</td>
              <td className="px-4 py-3 text-right tabular-nums font-bold">{formatCurrency(totalPlanificado)}</td>
              <td colSpan={canManage ? 3 : 2} className="px-4 py-3 text-xs text-muted-foreground">
                {cubre100
                  ? 'Cubre el 100% de la OC'
                  : `Disponible por planificar: ${porcentajeDisponible.toFixed(2)}%`}
              </td>
            </tr>
          </tfoot>
        </table>
      )}

      {adding && (
        <div className="px-5 py-4 border-t border-border space-y-3 bg-muted/10">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                % (máx. {porcentajeDisponible.toFixed(2)}%)
              </label>
              <Input
                type="number"
                min="0.01"
                max={porcentajeDisponible}
                step="0.01"
                value={porcentaje}
                onChange={(e) => setPorcentaje(e.target.value)}
                className="h-8 text-sm"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Monto</label>
              <Input
                value={porcentaje ? formatCurrency((Number(oc.montoTotal) * Number(porcentaje)) / 100) : '—'}
                disabled
                className="h-8 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Fecha programada</label>
              <Input type="date" value={fechaProgramada} onChange={(e) => setFechaProgramada(e.target.value)} className="h-8 text-sm" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Nota (opcional)</label>
            <Input value={nota} onChange={(e) => setNota(e.target.value)} className="h-8 text-sm" placeholder="Ej. Adelanto contra factura" />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={crearPago} disabled={saving} size="sm">
              <Check className="size-3.5" />
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setAdding(false); setPorcentaje(''); setFechaProgramada(''); setNota(''); setError(null) }}
              disabled={saving}
            >
              <X className="size-3.5" />
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {error && <p className="px-5 py-2 text-xs text-destructive border-t border-border">{error}</p>}
    </div>
  )
}
