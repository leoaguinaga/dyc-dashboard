'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useSession } from '@/lib/auth/session'
import { api } from '@/lib/api/client'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn, formatCurrency } from '@/lib/utils'
import { UNIDAD_OPTIONS } from '@/lib/inventario'
import { ocDesglose } from '@/lib/ordenes'
import type { OrdenCompraItem, UnidadMedida } from '@/types/api'

interface Props {
  ocId: string
  items: OrdenCompraItem[]
  montoTotal: string
  incluyeIgv: boolean
  editable: boolean
}

type LineaItem = {
  codigo: string
  descripcion: string
  cantidad: string
  unidad: UnidadMedida
  precioUnitario: string
}

const emptyLinea = (): LineaItem => ({ codigo: '', descripcion: '', cantidad: '', unidad: 'und', precioUnitario: '' })

// Descripción toma el espacio sobrante; código va como línea secundaria bajo la
// descripción (no como columna) y unidad se une a la cantidad. Las columnas
// responden al ancho de la tarjeta, no al de la ventana.
const GRID_WITH_ACTIONS = '@lg:grid-cols-[minmax(0,1fr)_88px_92px_104px_60px]'
const GRID_SIN_ACTIONS = '@lg:grid-cols-[minmax(0,1fr)_88px_92px_104px]'
const FORM_GRID = 'grid grid-cols-2 gap-2 @lg:grid-cols-[96px_minmax(0,1fr)_84px_104px_96px_92px_60px] @lg:items-center'

export function OcItemsTable({ ocId, items, montoTotal, incluyeIgv, editable }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const role = session?.user?.role
  const canEdit = editable && (role === 'administrador' || role === 'admin_ti' || role === 'logistica' || role === 'gerencia')
  const gridCols = canEdit ? GRID_WITH_ACTIONS : GRID_SIN_ACTIONS

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLinea, setEditLinea] = useState<LineaItem>(emptyLinea())
  const [adding, setAdding] = useState(false)
  const [nueva, setNueva] = useState<LineaItem>(emptyLinea())
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [porEliminar, setPorEliminar] = useState<OrdenCompraItem | null>(null)

  function startEdit(item: OrdenCompraItem) {
    setEditingId(item.id)
    setEditLinea({
      codigo: item.codigo ?? '',
      descripcion: item.descripcion,
      cantidad: String(parseFloat(item.cantidad)),
      unidad: item.unidad,
      precioUnitario: String(parseFloat(item.precioUnitario)),
    })
  }

  function validate(l: LineaItem) {
    if (!l.descripcion.trim()) return 'La descripción es requerida'
    if (!l.cantidad || parseFloat(l.cantidad) <= 0) return 'La cantidad debe ser mayor a 0'
    if (!l.precioUnitario || parseFloat(l.precioUnitario) < 0) return 'El precio unitario es requerido'
    return null
  }

  async function saveEdit(itemId: string) {
    const err = validate(editLinea)
    if (err) { setError(err); return }
    setSaving(true)
    setError(null)
    try {
      await api.patch(`/ordenes-compra/${ocId}/items/${itemId}`, {
        codigo: editLinea.codigo.trim() || undefined,
        descripcion: editLinea.descripcion.trim(),
        cantidad: parseFloat(editLinea.cantidad),
        unidad: editLinea.unidad,
        precioUnitario: parseFloat(editLinea.precioUnitario),
      })
      setEditingId(null)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar el ítem')
    } finally {
      setSaving(false)
    }
  }

  async function removeItem(itemId: string) {
    setSaving(true)
    setError(null)
    try {
      await api.delete(`/ordenes-compra/${ocId}/items/${itemId}`)
      setPorEliminar(null)
      router.refresh()
    } catch (e) {
      setPorEliminar(null)
      setError(e instanceof Error ? e.message : 'Error al eliminar el ítem')
    } finally {
      setSaving(false)
    }
  }

  async function addItem() {
    const err = validate(nueva)
    if (err) { setError(err); return }
    setSaving(true)
    setError(null)
    try {
      await api.post(`/ordenes-compra/${ocId}/items`, {
        codigo: nueva.codigo.trim() || undefined,
        descripcion: nueva.descripcion.trim(),
        cantidad: parseFloat(nueva.cantidad),
        unidad: nueva.unidad,
        precioUnitario: parseFloat(nueva.precioUnitario),
      })
      setNueva(emptyLinea())
      setAdding(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al agregar el ítem')
    } finally {
      setSaving(false)
    }
  }

  const iconBtn = 'flex size-9 @lg:size-7 items-center justify-center rounded text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

  function lineaForm(linea: LineaItem, setLinea: (fn: (p: LineaItem) => LineaItem) => void, opts: { onSave: () => void; onCancel: () => void; descPlaceholder: string; autoFocus?: boolean }) {
    const total = (parseFloat(linea.cantidad) || 0) * (parseFloat(linea.precioUnitario) || 0)
    return (
      <div className={cn('bg-muted/20 p-3', FORM_GRID)}>
        <Input aria-label="Código" value={linea.codigo} onChange={(e) => setLinea((p) => ({ ...p, codigo: e.target.value }))} className="h-8 text-xs" placeholder="Cód. (opcional)" />
        <Input aria-label="Descripción" value={linea.descripcion} onChange={(e) => setLinea((p) => ({ ...p, descripcion: e.target.value }))} className="col-span-2 h-8 text-sm @lg:col-span-1" placeholder={opts.descPlaceholder} autoFocus={opts.autoFocus} />
        <Input aria-label="Cantidad" type="number" min="0.01" step="0.01" value={linea.cantidad} onChange={(e) => setLinea((p) => ({ ...p, cantidad: e.target.value }))} className="h-8 text-sm text-right" placeholder="Cant." />
        <Select value={linea.unidad} onValueChange={(v) => setLinea((p) => ({ ...p, unidad: (v ?? 'und') as UnidadMedida }))}>
          <SelectTrigger aria-label="Unidad" className="h-8 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>{UNIDAD_OPTIONS.map(([u, label]) => <SelectItem key={u} value={u}>{label}</SelectItem>)}</SelectContent>
        </Select>
        <Input aria-label="Precio unitario" type="number" min="0" step="0.01" value={linea.precioUnitario} onChange={(e) => setLinea((p) => ({ ...p, precioUnitario: e.target.value }))} className="h-8 text-sm text-right" placeholder="P. unit" />
        <div className="flex h-8 items-center justify-end gap-2 text-sm tabular-nums text-muted-foreground">
          <span className="@lg:hidden text-[11px]">Total:</span>
          {formatCurrency(total)}
        </div>
        <div className="col-span-2 flex items-center justify-end gap-1 @lg:col-span-1 @lg:justify-center">
          <button type="button" aria-label="Guardar ítem" onClick={opts.onSave} disabled={saving} className={cn(iconBtn, 'text-success hover:bg-success-soft')}>
            <Check className="size-3.5" />
          </button>
          <button type="button" aria-label="Cancelar" onClick={opts.onCancel} disabled={saving} className={cn(iconBtn, 'hover:bg-muted')}>
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="@container h-fit rounded-xl border border-border bg-card text-sm">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ítems</h2>
        {canEdit && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded text-xs text-muted-foreground transition-colors duration-[120ms] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Agregar ítem (ej. transporte)
          </button>
        )}
      </div>

      <div className={cn('hidden gap-2 bg-muted/30 px-4 py-2.5 text-xs font-medium text-muted-foreground @lg:grid', gridCols)}>
        <span>Descripción</span>
        <span className="text-right">Cant.</span>
        <span className="text-right">P. unit</span>
        <span className="text-right">Total</span>
        {canEdit && <span className="sr-only">Acciones</span>}
      </div>

      <div className="divide-y divide-border @lg:divide-y-0">
        {items.map((item) => {
          if (editingId === item.id) {
            return (
              <div key={item.id} className="@lg:border-t @lg:border-border">
                {lineaForm(editLinea, setEditLinea, { onSave: () => saveEdit(item.id), onCancel: () => setEditingId(null), descPlaceholder: 'Descripción' })}
              </div>
            )
          }
          return (
            <div key={item.id} className={cn('group grid grid-cols-1 gap-1.5 p-3 @lg:items-center @lg:gap-2 @lg:border-t @lg:border-border @lg:py-2.5', gridCols)}>
              <div className="min-w-0">
                <p className="font-medium text-foreground">{item.descripcion}</p>
                {item.codigo && <p className="font-mono text-xs text-muted-foreground">{item.codigo}</p>}
              </div>
              <div className="text-right tabular-nums">
                <span className="@lg:hidden text-muted-foreground mr-1 text-[11px]">Cant.:</span>
                {Number(item.cantidad).toLocaleString('es-PE')}
                <span className="ml-1 text-muted-foreground">{item.unidad}</span>
              </div>
              <div className="text-right tabular-nums">
                <span className="@lg:hidden text-muted-foreground mr-1 text-[11px]">P. unit:</span>
                {formatCurrency(item.precioUnitario)}
              </div>
              <div className="text-right tabular-nums font-medium text-foreground">
                <span className="@lg:hidden text-muted-foreground mr-1 text-[11px] font-normal">Total:</span>
                {formatCurrency(item.precioTotal)}
              </div>
              {canEdit && (
                <div className="flex items-center justify-end gap-1 @lg:justify-center [@media(hover:hover)]:opacity-50 [@media(hover:hover)]:transition-opacity [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100">
                  <button type="button" aria-label={`Editar ítem ${item.descripcion}`} onClick={() => startEdit(item)} className={cn(iconBtn, 'hover:bg-muted hover:text-foreground')}>
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Eliminar ítem ${item.descripcion}`}
                    onClick={() => setPorEliminar(item)}
                    disabled={saving || items.length === 1}
                    className={cn(iconBtn, 'hover:bg-danger-soft hover:text-danger disabled:pointer-events-none disabled:opacity-30')}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {adding && (
          <div className="@lg:border-t @lg:border-border">
            {lineaForm(nueva, setNueva, {
              onSave: addItem,
              onCancel: () => { setAdding(false); setNueva(emptyLinea()); setError(null) },
              descPlaceholder: 'Ej. Transporte a obra',
              autoFocus: true,
            })}
          </div>
        )}
      </div>

      <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-1">
        {(() => {
          const d = ocDesglose({ montoTotal, incluyeIgv })
          return (
            <>
              <div className="flex items-center justify-between @lg:justify-end @lg:gap-4 text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatCurrency(d.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between @lg:justify-end @lg:gap-4 text-sm text-muted-foreground">
                <span>IGV (18%){incluyeIgv ? ' incluido' : ''}</span>
                <span className="tabular-nums">{formatCurrency(d.igv)}</span>
              </div>
              <div className="flex items-center justify-between @lg:justify-end @lg:gap-4">
                <span className="text-sm font-medium">Total</span>
                <span className="tabular-nums font-bold">{formatCurrency(d.total)}</span>
              </div>
            </>
          )
        })()}
      </div>

      {error && (
        <p role="alert" className="px-5 py-2 text-xs text-destructive border-t border-border">{error}</p>
      )}

      <ConfirmDialog
        open={porEliminar !== null}
        onOpenChange={(open) => { if (!open) setPorEliminar(null) }}
        title="¿Eliminar este ítem?"
        description={
          porEliminar
            ? `Se quitará «${porEliminar.descripcion}» (${formatCurrency(porEliminar.precioTotal)}) de la orden. El monto total y el plan de pagos se recalcularán.`
            : undefined
        }
        confirmLabel="Eliminar ítem"
        cancelLabel="Conservar"
        destructive
        loading={saving}
        onConfirm={() => (porEliminar ? removeItem(porEliminar.id) : undefined)}
      />
    </div>
  )
}
