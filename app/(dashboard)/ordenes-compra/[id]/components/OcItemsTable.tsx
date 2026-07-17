'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { useSession } from '@/lib/auth/session'
import { api } from '@/lib/api/client'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn, formatCurrency } from '@/lib/utils'
import type { OrdenCompraItem, UnidadMedida } from '@/types/api'

const UNIDADES: UnidadMedida[] = ['und', 'kg', 'm', 'm2', 'm3', 'l', 'gal', 'bolsa', 'caja', 'rollo', 'par', 'juego']

interface Props {
  ocId: string
  items: OrdenCompraItem[]
  montoTotal: string
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

export function OcItemsTable({ ocId, items, montoTotal, editable }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const role = session?.user?.role
  const canEdit = editable && (role === 'administrador' || role === 'logistica')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLinea, setEditLinea] = useState<LineaItem>(emptyLinea())
  const [adding, setAdding] = useState(false)
  const [nueva, setNueva] = useState<LineaItem>(emptyLinea())
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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
      router.refresh()
    } catch (e) {
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

  return (
    <div className="rounded-xl border border-border bg-white overflow-x-auto h-fit">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ítems</h2>
        {canEdit && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors duration-[120ms]"
          >
            <Plus className="size-3.5" />
            Agregar ítem (ej. transporte)
          </button>
        )}
      </div>
      <table className="w-full text-sm">
        <thead className="bg-muted/30">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Cód.</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Descripción</th>
            <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Cant.</th>
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Unidad</th>
            <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">P. unit</th>
            <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Total</th>
            {canEdit && <th className="px-4 py-2.5 w-16" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => {
            if (editingId === item.id) {
              return (
                <tr key={item.id} className="bg-muted/20">
                  <td className="px-2 py-2">
                    <Input value={editLinea.codigo} onChange={(e) => setEditLinea((p) => ({ ...p, codigo: e.target.value }))} className="h-8 text-xs" />
                  </td>
                  <td className="px-2 py-2">
                    <Input value={editLinea.descripcion} onChange={(e) => setEditLinea((p) => ({ ...p, descripcion: e.target.value }))} className="h-8 text-sm" />
                  </td>
                  <td className="px-2 py-2 w-24">
                    <Input type="number" min="0.01" step="0.01" value={editLinea.cantidad} onChange={(e) => setEditLinea((p) => ({ ...p, cantidad: e.target.value }))} className="h-8 text-sm text-right" />
                  </td>
                  <td className="px-2 py-2 w-28">
                    <Select value={editLinea.unidad} onValueChange={(v) => setEditLinea((p) => ({ ...p, unidad: (v ?? 'und') as UnidadMedida }))}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{UNIDADES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-2 w-28">
                    <Input type="number" min="0" step="0.01" value={editLinea.precioUnitario} onChange={(e) => setEditLinea((p) => ({ ...p, precioUnitario: e.target.value }))} className="h-8 text-sm text-right" />
                  </td>
                  <td className="px-4 py-2 text-right text-muted-foreground tabular-nums">
                    {formatCurrency((parseFloat(editLinea.cantidad) || 0) * (parseFloat(editLinea.precioUnitario) || 0))}
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1">
                      <button onClick={() => saveEdit(item.id)} disabled={saving} className="flex size-7 items-center justify-center rounded text-chart-2 hover:bg-chart-2/10">
                        <Check className="size-3.5" />
                      </button>
                      <button onClick={() => setEditingId(null)} disabled={saving} className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted">
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            }
            return (
              <tr key={item.id} className="group">
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{item.codigo ?? '—'}</td>
                <td className="px-4 py-3">{item.descripcion}</td>
                <td className="px-4 py-3 text-right tabular-nums">{Number(item.cantidad).toLocaleString('es-PE')}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.unidad}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(item.precioUnitario)}</td>
                <td className="px-4 py-3 text-right tabular-nums font-medium">{formatCurrency(item.precioTotal)}</td>
                {canEdit && (
                  <td className="px-2 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(item)} className="flex size-7 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted">
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={saving || items.length === 1}
                        className="flex size-7 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/5 disabled:pointer-events-none disabled:opacity-30"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            )
          })}

          {adding && (
            <tr className="bg-muted/20">
              <td className="px-2 py-2">
                <Input value={nueva.codigo} onChange={(e) => setNueva((p) => ({ ...p, codigo: e.target.value }))} className="h-8 text-xs" placeholder="Opcional" />
              </td>
              <td className="px-2 py-2">
                <Input value={nueva.descripcion} onChange={(e) => setNueva((p) => ({ ...p, descripcion: e.target.value }))} className="h-8 text-sm" placeholder="Ej. Transporte a obra" autoFocus />
              </td>
              <td className="px-2 py-2 w-24">
                <Input type="number" min="0.01" step="0.01" value={nueva.cantidad} onChange={(e) => setNueva((p) => ({ ...p, cantidad: e.target.value }))} className="h-8 text-sm text-right" placeholder="1" />
              </td>
              <td className="px-2 py-2 w-28">
                <Select value={nueva.unidad} onValueChange={(v) => setNueva((p) => ({ ...p, unidad: (v ?? 'und') as UnidadMedida }))}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{UNIDADES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </td>
              <td className="px-2 py-2 w-28">
                <Input type="number" min="0" step="0.01" value={nueva.precioUnitario} onChange={(e) => setNueva((p) => ({ ...p, precioUnitario: e.target.value }))} className="h-8 text-sm text-right" placeholder="0.00" />
              </td>
              <td className="px-4 py-2 text-right text-muted-foreground tabular-nums">
                {formatCurrency((parseFloat(nueva.cantidad) || 0) * (parseFloat(nueva.precioUnitario) || 0))}
              </td>
              <td className="px-2 py-2">
                <div className="flex items-center gap-1">
                  <button onClick={addItem} disabled={saving} className="flex size-7 items-center justify-center rounded text-chart-2 hover:bg-chart-2/10">
                    <Check className="size-3.5" />
                  </button>
                  <button onClick={() => { setAdding(false); setNueva(emptyLinea()); setError(null) }} disabled={saving} className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted">
                    <X className="size-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          )}
        </tbody>
        <tfoot className="border-t border-border bg-muted/20">
          <tr>
            <td colSpan={canEdit ? 5 : 5} className="px-4 py-3 text-right text-sm font-medium">Total</td>
            <td className="px-4 py-3 text-right tabular-nums font-bold">{formatCurrency(montoTotal)}</td>
            {canEdit && <td />}
          </tr>
        </tfoot>
      </table>
      {error && (
        <p className={cn('px-5 py-2 text-xs text-destructive border-t border-border')}>{error}</p>
      )}
    </div>
  )
}
