'use client'

import type { ReactNode } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { cn } from '@/lib/utils'

export interface TramoPagoRow {
  porcentaje: string
  fecha: string
}

export interface TramosPagoExtraColumn<T extends TramoPagoRow> {
  header: string
  align?: 'left' | 'right'
  render: (row: T, index: number) => ReactNode
}

interface Props<T extends TramoPagoRow> {
  rows: T[]
  onUpdate: (index: number, field: keyof TramoPagoRow, value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
  extraColumns?: TramosPagoExtraColumn<T>[]
  disabled?: boolean
  addLabel?: string
}

// Clases literales (no interpoladas) para que Tailwind las detecte al escanear
// el archivo: la cantidad de columnas extra sólo puede ser 0-3 en este sistema
// (cotizaciones no usa ninguna; el plan de pagos de la OC usa monto,
// detracción opcional y neto).
const GRID_COLS: Record<number, string> = {
  0: 'sm:grid-cols-[110px_1fr_28px]',
  1: 'sm:grid-cols-[110px_1fr_100px_28px]',
  2: 'sm:grid-cols-[110px_1fr_90px_100px_28px]',
  3: 'sm:grid-cols-[110px_1fr_90px_90px_100px_28px]',
}

/**
 * Editor de cuotas de pago (%, fecha) con filas agregables/removibles y suma a
 * 100% visible. Nace del editor de condiciones de pago de cotizaciones
 * (ReceiveCotizacionForm) para reusarse también en el plan de pagos de la OC,
 * que además necesita columnas de solo lectura (monto, detracción, neto).
 */
export function TramosPagoEditor<T extends TramoPagoRow>({
  rows,
  onUpdate,
  onAdd,
  onRemove,
  extraColumns = [],
  disabled = false,
  addLabel = 'Agregar cuota de pago',
}: Props<T>) {
  const suma = rows.reduce((s, r) => s + (parseFloat(r.porcentaje) || 0), 0)
  const restante = Math.round((100 - suma) * 100) / 100
  const sumaCompleta = Math.abs(suma - 100) < 0.01
  const gridColsClass = GRID_COLS[Math.min(extraColumns.length, 3)]

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Cuotas de pago</span>
        <span
          className={cn(
            'inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full tabular-nums',
            sumaCompleta ? 'bg-chart-2/15 text-chart-2' : 'bg-amber-500/15 text-amber-600',
          )}
        >
          {sumaCompleta ? '✓ Suma 100%' : `Faltan ${restante > 0 ? restante : 0}% para 100%`}
        </span>
      </div>

      <div className={cn('hidden gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid', gridColsClass)}>
        <span>Porcentaje (%)</span>
        <span>Fecha estimada de pago</span>
        {extraColumns.map((c) => (
          <span key={c.header} className={c.align === 'right' ? 'text-right' : undefined}>
            {c.header}
          </span>
        ))}
        <span />
      </div>

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div
            key={i}
            className={cn(
              'grid grid-cols-1 gap-2 items-start rounded-md border border-border/80 bg-white p-2 sm:p-0 sm:border-0 sm:bg-transparent',
              gridColsClass,
            )}
          >
            <Input
              type="number"
              min="0.01"
              max="100"
              step="0.01"
              value={row.porcentaje}
              onChange={(e) => onUpdate(i, 'porcentaje', e.target.value)}
              placeholder="Ej. 100"
              disabled={disabled}
              className="h-8 text-sm font-mono text-right"
            />
            <DatePicker
              value={row.fecha}
              onValueChange={(v) => onUpdate(i, 'fecha', v)}
              placeholder="Seleccionar fecha…"
              className="h-8"
            />
            {extraColumns.map((c) => (
              <div
                key={c.header}
                className={cn(
                  'flex items-center h-8 text-sm tabular-nums',
                  c.align === 'right' ? 'justify-end' : 'justify-start',
                )}
              >
                <span className="sm:hidden text-muted-foreground mr-auto text-[11px]">{c.header}:</span>
                {c.render(row, i)}
              </div>
            ))}
            <button
              type="button"
              onClick={() => onRemove(i)}
              disabled={disabled || rows.length === 1}
              aria-label="Eliminar cuota"
              className="mt-0.5 flex size-7 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-[120ms] disabled:pointer-events-none disabled:opacity-30 sm:mx-auto"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-[120ms] py-1 disabled:pointer-events-none disabled:opacity-40"
      >
        <Plus className="size-3.5" />
        {addLabel}
      </button>
    </div>
  )
}
