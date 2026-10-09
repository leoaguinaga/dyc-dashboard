'use client'

import { Paperclip, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UNIDAD_LABELS } from '@/lib/inventario'
import { esPegadoTabular, parsearPegado, type FilaPegada } from '@/lib/requerimientos-paste'
import { cn } from '@/lib/utils'
import type { UnidadMedida } from '@/types/api'

export interface LineaTabla {
  id: string
  descripcion: string
  cantidad: string
  /** Vacío cuando una unidad pegada no se reconoció y falta elegirla. */
  unidad: UnidadMedida | ''
  observacion?: string
  precio?: string
  adjuntos?: number
}

export type CampoLinea = 'descripcion' | 'cantidad' | 'unidad' | 'precio' | 'observacion'

// Columnas navegables con teclado; la 2 es el select de unidad y se salta con flechas.
export const COL_DESCRIPCION = 0
const COL_CANTIDAD = 1
const COL_UNIDAD = 2
const COL_EXTRA = 3 // observaciones o precio unitario, según la variante

const UNIDAD_GROUPS: Array<{ label: string; values: UnidadMedida[] }> = [
  { label: 'Uso general', values: ['und', 'pieza', 'par', 'juego', 'global'] },
  { label: 'Dimensiones', values: ['m', 'm2', 'm3'] },
  { label: 'Peso', values: ['kg', 'g'] },
  { label: 'Líquidos', values: ['l', 'ml', 'gal'] },
  { label: 'Conteo por lote', values: ['docena', 'medio_ciento', 'ciento', 'medio_millar', 'millar'] },
  { label: 'Presentación y envase', values: ['bolsa', 'caja', 'rollo', 'balde', 'galonera', 'cilindro'] },
  { label: 'Formato de material', values: ['varilla', 'plancha', 'tubo'] },
]

const cellCn =
  'h-8 text-sm md:border-transparent md:bg-transparent md:hover:border-input md:focus-visible:bg-white md:aria-invalid:border-destructive'
const numCn = 'text-right font-mono tabular-nums md:text-right'

export function fmtSoles(v: number) {
  return `S/ ${v.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function subtotalLinea(l: Pick<LineaTabla, 'cantidad' | 'precio'>) {
  return (parseFloat(l.cantidad) || 0) * (parseFloat(l.precio ?? '') || 0)
}

const decimal = (v: string) => v.replace(',', '.')
const esDecimal = (v: string) => /^\d*\.?\d*$/.test(v)

interface Props {
  /** Prefijo de los `data-cell`, para que varias tablas en la misma página no choquen. */
  prefijo?: string
  etiqueta: string
  lineas: LineaTabla[]
  /** Variante con precio unitario y subtotal (compras ya cotizadas). */
  conPrecio?: boolean
  /** Variante con observaciones y adjuntos por ítem (requerimientos). */
  conObservacion?: boolean
  getError: (index: number, campo: CampoLinea) => string | undefined
  onChange: (index: number, patch: Partial<Omit<LineaTabla, 'id'>>) => void
  onAgregar: () => void
  onQuitar: (index: number) => void
  onPegarFilas: (index: number, filas: FilaPegada[]) => void
  onAbrirEspecificacion?: (index: number) => void
  /** Texto del botón y ayuda bajo la tabla; el padre puede añadir acciones propias. */
  ayuda?: React.ReactNode
}

/**
 * Tabla de líneas común al requerimiento y a la compra simple: numeración, Enter que agrega fila,
 * flechas entre filas, pegado desde Excel y tarjeta por ítem bajo `md`.
 */
export function LineasTable({
  prefijo = '',
  etiqueta,
  lineas,
  conPrecio = false,
  conObservacion = false,
  getError,
  onChange,
  onAgregar,
  onQuitar,
  onPegarFilas,
  onAbrirEspecificacion,
  ayuda,
}: Props) {
  const celda = (row: number, col: number) => `${prefijo}${row}-${col}`

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number, col: number) {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter') {
      e.preventDefault()
      if (index === lineas.length - 1) onAgregar()
      else document.querySelector<HTMLElement>(`[data-cell="${celda(index + 1, col)}"]`)?.focus()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const target = document.querySelector<HTMLElement>(`[data-cell="${celda(index + (e.key === 'ArrowDown' ? 1 : -1), col)}"]`)
      if (target) {
        e.preventDefault()
        target.focus()
      }
    }
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>, index: number) {
    const texto = e.clipboardData.getData('text')
    if (!esPegadoTabular(texto)) return
    e.preventDefault()
    onPegarFilas(index, parsearPegado(texto))
  }

  const columnas = conPrecio
    ? 'md:grid-cols-[28px_minmax(0,2fr)_76px_132px_96px_108px_40px]'
    : 'md:grid-cols-[28px_minmax(0,2fr)_76px_132px_minmax(0,1.4fr)_64px]'

  return (
    <div role="table" aria-label={etiqueta}>
      <div
        role="row"
        className={cn(
          'hidden items-center gap-1.5 border-b border-border px-2 pb-1.5 pt-2 text-xs text-muted-foreground md:grid',
          columnas,
        )}
      >
        <span role="columnheader" className="text-right">#</span>
        <span role="columnheader">Descripción</span>
        <span role="columnheader">Cant.</span>
        <span role="columnheader">Unidad</span>
        {conPrecio && <span role="columnheader">P. unitario</span>}
        {conPrecio && <span role="columnheader" className="text-right">Subtotal</span>}
        {conObservacion && <span role="columnheader">Observaciones</span>}
        <span role="columnheader" className="sr-only">Acciones</span>
      </div>

      {lineas.map((linea, i) => {
        const n = i + 1
        const errDescripcion = getError(i, 'descripcion')
        const errCantidad = getError(i, 'cantidad')
        const errUnidad = getError(i, 'unidad')
        const errPrecio = getError(i, 'precio')
        const sinUnidad = linea.unidad === ''
        const adjuntos = linea.adjuntos ?? 0
        return (
          <div
            key={linea.id}
            role="row"
            className={cn(
              'group/row mt-2 grid grid-cols-2 items-end gap-x-2 gap-y-1.5 rounded-lg border border-border p-2 md:mt-0 md:items-center md:gap-1.5 md:border-0 md:px-2 md:py-0.5 md:hover:bg-muted/50 md:focus-within:bg-muted/50',
              columnas,
            )}
          >
            <span role="cell" className="hidden text-right font-mono text-xs tabular-nums text-muted-foreground md:block">
              {n}
            </span>

            <div role="cell" className="col-span-2 md:col-span-1">
              <span className="mb-0.5 block text-xs text-muted-foreground md:hidden">Ítem {n} · Descripción</span>
              <Input
                data-cell={celda(i, COL_DESCRIPCION)}
                value={linea.descripcion}
                onChange={(e) => onChange(i, { descripcion: e.target.value })}
                onKeyDown={(e) => onKeyDown(e, i, COL_DESCRIPCION)}
                onPaste={(e) => onPaste(e, i)}
                placeholder="Ej: Plancha melamina 18 mm blanco"
                aria-label={`Descripción del ítem ${n}`}
                aria-invalid={!!errDescripcion}
                title={errDescripcion}
                className={cellCn}
              />
            </div>

            <div role="cell">
              <span className="mb-0.5 block text-xs text-muted-foreground md:hidden">Cant.</span>
              <Input
                data-cell={celda(i, COL_CANTIDAD)}
                inputMode="decimal"
                value={linea.cantidad}
                onChange={(e) => {
                  const v = decimal(e.target.value)
                  if (esDecimal(v)) onChange(i, { cantidad: v })
                }}
                onKeyDown={(e) => onKeyDown(e, i, COL_CANTIDAD)}
                placeholder="0"
                aria-label={`Cantidad del ítem ${n}`}
                aria-invalid={!!errCantidad}
                title={errCantidad}
                className={cn(cellCn, numCn)}
              />
            </div>

            <div role="cell">
              <span className="mb-0.5 block text-xs text-muted-foreground md:hidden">Unidad</span>
              <select
                data-cell={celda(i, COL_UNIDAD)}
                value={linea.unidad}
                onChange={(e) => onChange(i, { unidad: e.target.value as UnidadMedida })}
                aria-label={`Unidad del ítem ${n}`}
                aria-invalid={!!errUnidad || undefined}
                title={errUnidad}
                className={cn(
                  'h-8 w-full min-w-0 rounded-lg border border-input bg-white px-1.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:border-transparent md:bg-transparent md:hover:border-input md:focus-visible:bg-white',
                  sinUnidad && 'border-amber-500 bg-amber-500/10 text-amber-700 md:border-amber-500',
                  errUnidad && 'border-destructive md:border-destructive',
                )}
              >
                {sinUnidad && (
                  <option value="" disabled>
                    Elegir…
                  </option>
                )}
                {UNIDAD_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.values.map((value) => (
                      <option key={value} value={value}>
                        {UNIDAD_LABELS[value]}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {conPrecio && (
              <div role="cell">
                <span className="mb-0.5 block text-xs text-muted-foreground md:hidden">P. unitario</span>
                <Input
                  data-cell={celda(i, COL_EXTRA)}
                  inputMode="decimal"
                  value={linea.precio ?? ''}
                  onChange={(e) => {
                    const v = decimal(e.target.value)
                    if (esDecimal(v)) onChange(i, { precio: v })
                  }}
                  onKeyDown={(e) => onKeyDown(e, i, COL_EXTRA)}
                  placeholder="0.00"
                  aria-label={`Precio unitario del ítem ${n}`}
                  aria-invalid={!!errPrecio}
                  title={errPrecio}
                  className={cn(cellCn, numCn)}
                />
              </div>
            )}

            {conPrecio && (
              <div role="cell" className="md:text-right">
                <span className="mb-0.5 block text-xs text-muted-foreground md:hidden">Subtotal</span>
                <span className="block font-mono text-sm tabular-nums">{fmtSoles(subtotalLinea(linea))}</span>
              </div>
            )}

            {conObservacion && (
              <div role="cell" className="col-span-2 md:col-span-1">
                <span className="mb-0.5 block text-xs text-muted-foreground md:hidden">Observaciones</span>
                <Input
                  data-cell={celda(i, COL_EXTRA)}
                  value={linea.observacion ?? ''}
                  onChange={(e) => onChange(i, { observacion: e.target.value })}
                  onKeyDown={(e) => onKeyDown(e, i, COL_EXTRA)}
                  placeholder="Talla, marca, uso"
                  aria-label={`Observaciones del ítem ${n}`}
                  className={cellCn}
                />
              </div>
            )}

            <div role="cell" className="col-span-2 flex items-center justify-between md:col-span-1 md:justify-end">
              <span className="text-xs font-medium text-muted-foreground md:hidden">Acciones</span>
              <div className="flex items-center gap-0.5 md:opacity-40 md:transition-opacity md:group-hover/row:opacity-100 md:group-focus-within/row:opacity-100">
                {onAbrirEspecificacion && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onAbrirEspecificacion(i)}
                    aria-label={adjuntos > 0 ? `Adjuntos del ítem ${n}: ${adjuntos}` : `Adjuntar archivo al ítem ${n}`}
                    className={cn(adjuntos > 0 && 'w-auto gap-0.5 px-1.5 text-primary')}
                  >
                    <Paperclip />
                    {adjuntos > 0 && <span className="text-xs tabular-nums">{adjuntos}</span>}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onQuitar(i)}
                  disabled={lineas.length === 1 && !conObservacion}
                  aria-label={`Eliminar ítem ${n}`}
                  className="text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          </div>
        )
      })}

      <button
        type="button"
        onClick={onAgregar}
        className="mt-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:bg-muted hover:text-foreground"
      >
        <Plus className="size-4" />
        Agregar fila
        <span className="hidden text-xs text-muted-foreground/80 lg:inline">
          (Enter en {conPrecio ? 'el precio' : 'la última celda'} de la última fila agrega una nueva)
        </span>
      </button>
      {ayuda}
    </div>
  )
}
