'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X, AlertTriangle, ChevronRight } from 'lucide-react'
import { useSession } from '@/lib/auth/session'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { TramosPagoEditor } from '@/components/pagos/TramosPagoEditor'
import { cn, formatCurrency, formatDateOnly, formatPercent } from '@/lib/utils'
import type { OrdenCompra, Pago } from '@/types/api'

interface Props {
  oc: OrdenCompra
  pagos: Pago[]
  editable?: boolean
}

interface EditRow {
  id?: string
  porcentaje: string
  fecha: string
}

const ESTADO_LABEL: Record<Pago['estadoEfectivo'], string> = {
  borrador: 'Por completar',
  pendiente: 'Pendiente',
  vencido: 'Vencido',
  pagado: 'Pagado',
  cancelado: 'Cancelado',
}

const ESTADO_CLASS: Record<Pago['estadoEfectivo'], string> = {
  borrador: 'bg-chart-3/10 text-chart-3',
  pendiente: 'bg-muted text-muted-foreground',
  vencido: 'bg-destructive/10 text-destructive',
  pagado: 'bg-chart-2/10 text-chart-2',
  cancelado: 'bg-muted text-muted-foreground/60',
}

const fmtDate = formatDateOnly

// Fecha va a ancho fijo (su contenido es texto corto, no un control que
// llene la celda); el espacio flexible se deja al final, en Estado, que es
// donde una celda angosta luce natural en vez de generar un salto raro
// justo después de la primera columna.
const PAGOS_GRID_SIN_FISCAL = 'sm:grid-cols-[150px_70px_100px_100px_1fr_24px]'
const PAGOS_GRID_CON_FISCAL = 'sm:grid-cols-[150px_70px_90px_90px_90px_1fr_24px]'

function toEditRows(pagos: Pago[]): EditRow[] {
  const editables = pagos.filter((p) => p.estado === 'pendiente' || p.estado === 'borrador')
  if (editables.length === 0) return [{ porcentaje: '', fecha: '' }]
  return editables.map((p) => ({ id: p.id, porcentaje: String(Number(p.porcentaje)), fecha: p.fechaProgramada.slice(0, 10) }))
}

export function PagoPlanCard({ oc, pagos: initialPagos, editable = true }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const role = session?.user?.role
  const canManage = editable && (role === 'administrador' || role === 'admin_ti' || role === 'logistica' || role === 'gerencia')

  const [pagos, setPagos] = useState(initialPagos)
  const [editing, setEditing] = useState(false)
  const [rows, setRows] = useState<EditRow[]>(() => toEditRows(initialPagos))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bloqueados = pagos.filter((p) => p.estado === 'pagado' || p.estado === 'cancelado')
  const pctBloqueado = bloqueados
    .filter((p) => p.estado === 'pagado')
    .reduce((s, p) => s + Number(p.porcentaje), 0)

  const montoTotal = Number(oc.montoTotal)
  const tieneDescuentoFiscal = Boolean(Number(oc.detraccionPorcentaje) > 0 || Number(oc.retencionPorcentaje) > 0)
  const pctFiscal = Number(oc.detraccionPorcentaje) > 0 ? Number(oc.detraccionPorcentaje) : Number(oc.retencionPorcentaje)
  const labelFiscal = Number(oc.detraccionPorcentaje) > 0 ? 'Detracción' : 'Retención'

  function montoDe(row: EditRow) {
    return (montoTotal * (parseFloat(row.porcentaje) || 0)) / 100
  }
  function detraccionDe(row: EditRow) {
    return tieneDescuentoFiscal ? (montoDe(row) * pctFiscal) / 100 : 0
  }
  function netoDe(row: EditRow) {
    return montoDe(row) - detraccionDe(row)
  }

  function startEditing() {
    setRows(toEditRows(pagos))
    setError(null)
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
    setError(null)
  }

  function updateRow(i: number, field: 'porcentaje' | 'fecha', value: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))
  }

  function addRow() {
    const suma = rows.reduce((s, r) => s + (parseFloat(r.porcentaje) || 0), 0)
    const restante = Math.round((100 - pctBloqueado - suma) * 100) / 100
    setRows((prev) => [...prev, { porcentaje: restante > 0 ? String(restante) : '', fecha: '' }])
  }

  function removeRow(i: number) {
    setRows((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function guardar() {
    const completos = rows.every((r) => r.porcentaje && parseFloat(r.porcentaje) > 0 && r.fecha)
    if (!completos) {
      setError('Completa el porcentaje y la fecha de cada cuota')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const data = await api.put<Pago[]>(`/pagos/orden/${oc.id}`, {
        tramos: rows.map((r) => ({
          id: r.id,
          porcentaje: parseFloat(r.porcentaje),
          fecha: r.fecha,
        })),
      })
      setPagos(data)
      setEditing(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar el plan de pagos')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Plan de pagos</h2>
        {canManage && !editing && (
          <button
            onClick={startEditing}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
          >
            <Pencil className="size-3" />
            Editar
          </button>
        )}
      </div>

      {!editing && pagos.length === 0 && (
        <p className="px-5 py-4 text-sm text-muted-foreground">Sin pagos programados aún.</p>
      )}

      {!editing && pagos.length > 0 && (
        <div>
          <div
            className={cn(
              'hidden gap-2 bg-muted/30 px-4 py-2.5 text-xs font-medium text-muted-foreground sm:grid',
              tieneDescuentoFiscal ? PAGOS_GRID_CON_FISCAL : PAGOS_GRID_SIN_FISCAL,
            )}
          >
            <span>Fecha</span>
            <span className="text-right">%</span>
            <span className="text-right">Bruto</span>
            {tieneDescuentoFiscal && <span className="text-right">{labelFiscal}</span>}
            <span className="text-right">Neto</span>
            <span>Estado</span>
            <span />
          </div>
          <div className="divide-y divide-border sm:divide-y-0">
            {pagos.map((p) => {
              const detraccion = tieneDescuentoFiscal ? (Number(p.monto) * pctFiscal) / 100 : 0
              return (
                <div
                  key={p.id}
                  onClick={() => router.push(`/pagos/${p.id}`)}
                  className={cn(
                    'group grid grid-cols-2 items-center gap-y-1.5 gap-x-3 p-4 cursor-pointer hover:bg-muted/20 sm:gap-2 sm:border-t sm:border-border sm:py-3',
                    tieneDescuentoFiscal ? PAGOS_GRID_CON_FISCAL : PAGOS_GRID_SIN_FISCAL,
                  )}
                >
                  <div className="col-span-2 sm:col-span-1">
                    <div className="flex items-center gap-1.5">
                      {p.estadoEfectivo === 'vencido' && <AlertTriangle className="size-3.5 text-destructive" />}
                      {fmtDate(p.fechaProgramada)}
                    </div>
                    {p.fechaPagoReal && (
                      <div className="text-xs text-muted-foreground">Pagado {fmtDate(p.fechaPagoReal)}</div>
                    )}
                  </div>
                  <div className="text-right tabular-nums font-medium sm:text-right">
                    <span className="sm:hidden text-muted-foreground mr-1 text-[11px] font-normal">%:</span>
                    {formatPercent(p.porcentaje)}
                  </div>
                  <div className="text-right tabular-nums text-muted-foreground">
                    <span className="sm:hidden text-muted-foreground mr-1 text-[11px]">Bruto:</span>
                    {formatCurrency(p.monto)}
                  </div>
                  {tieneDescuentoFiscal && (
                    <div className="text-right tabular-nums text-muted-foreground">
                      <span className="sm:hidden text-muted-foreground mr-1 text-[11px]">{labelFiscal}:</span>
                      {formatCurrency(detraccion)}
                    </div>
                  )}
                  <div className="text-right tabular-nums font-medium">
                    <span className="sm:hidden text-muted-foreground mr-1 text-[11px]">Neto:</span>
                    {formatCurrency(Number(p.monto) - detraccion)}
                  </div>
                  <div>
                    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', ESTADO_CLASS[p.estadoEfectivo])}>
                      {ESTADO_LABEL[p.estadoEfectivo]}
                    </span>
                  </div>
                  <div className="hidden sm:flex text-muted-foreground/50 group-hover:text-foreground justify-end">
                    <ChevronRight className="size-3.5" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {editing && (
        <div className="px-5 py-4 space-y-3">
          {bloqueados.length > 0 && (
            <div className="rounded-md border border-border/70 bg-muted/20 p-2.5 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground/80">Cuotas ya pagadas o canceladas (no editables aquí)</p>
              {bloqueados.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-2">
                  <span>{fmtDate(p.fechaProgramada)} · {formatPercent(p.porcentaje)} · {formatCurrency(p.monto)}</span>
                  <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium', ESTADO_CLASS[p.estadoEfectivo])}>
                    {ESTADO_LABEL[p.estadoEfectivo]}
                  </span>
                </div>
              ))}
            </div>
          )}

          <TramosPagoEditor
            rows={rows}
            onUpdate={updateRow}
            onAdd={addRow}
            onRemove={removeRow}
            disabled={saving}
            extraColumns={[
              { header: 'Bruto', align: 'right', render: (row) => formatCurrency(montoDe(row)) },
              ...(tieneDescuentoFiscal
                ? [{ header: labelFiscal, align: 'right' as const, render: (row: EditRow) => formatCurrency(detraccionDe(row)) }]
                : []),
              { header: 'Neto', align: 'right', render: (row) => formatCurrency(netoDe(row)) },
            ]}
          />

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex items-center gap-1.5 pt-1">
            <Button size="sm" onClick={guardar} disabled={saving} className="h-7 px-3 text-xs gap-1">
              <Check className="size-3" />
              {saving ? 'Guardando…' : 'Guardar plan de pagos'}
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEditing} disabled={saving} className="h-7 px-2 text-xs gap-1">
              <X className="size-3" />
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
