'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { UNIDAD_OPTIONS, UNIDAD_ABBR } from '@/lib/inventario'
import type { CatalogoProductoProveedor, UnidadMedida } from '@/types/api'

interface Props {
  proveedorId: string
  initialItems: CatalogoProductoProveedor[]
}

interface EditingState {
  descripcion: string
  precioRef: string
  unidad: UnidadMedida
  nota: string
}

const emptyEditing = (): EditingState => ({ descripcion: '', precioRef: '', unidad: 'und', nota: '' })

function formatPrecio(val: string) {
  const n = parseFloat(val)
  if (isNaN(n)) return '—'
  return n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function CatalogoProveedorSection({ proveedorId, initialItems }: Props) {
  const [items, setItems] = useState(initialItems)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addingNew, setAddingNew] = useState(false)
  const [newItem, setNewItem] = useState<EditingState>(emptyEditing())
  const [editState, setEditState] = useState<EditingState>(emptyEditing())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAdd() {
    if (!newItem.descripcion.trim() || !newItem.precioRef) return
    setLoading(true)
    setError(null)
    try {
      const created = await api.post<CatalogoProductoProveedor>(
        `/proveedores/${proveedorId}/catalogo`,
        {
          descripcion: newItem.descripcion.trim(),
          precioRef: parseFloat(newItem.precioRef),
          unidad: newItem.unidad,
          nota: newItem.nota.trim() || undefined,
        },
      )
      setItems((p) => [...p, created])
      setNewItem(emptyEditing())
      setAddingNew(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar')
    } finally {
      setLoading(false)
    }
  }

  function startEdit(item: CatalogoProductoProveedor) {
    setEditingId(item.id)
    setEditState({
      descripcion: item.descripcion,
      precioRef: item.precioRef,
      unidad: item.unidad,
      nota: item.nota ?? '',
    })
  }

  async function handleSaveEdit(id: string) {
    if (!editState.descripcion.trim() || !editState.precioRef) return
    setLoading(true)
    setError(null)
    try {
      const updated = await api.patch<CatalogoProductoProveedor>(
        `/proveedores/${proveedorId}/catalogo/${id}`,
        {
          descripcion: editState.descripcion.trim(),
          precioRef: parseFloat(editState.precioRef),
          unidad: editState.unidad,
          nota: editState.nota.trim() || undefined,
        },
      )
      setItems((p) => p.map((i) => (i.id === id ? updated : i)))
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    setLoading(true)
    setError(null)
    try {
      await api.delete(`/proveedores/${proveedorId}/catalogo/${id}`)
      setItems((p) => p.filter((i) => i.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Catálogo de productos ({items.filter((i) => i.vigente).length} vigentes)
        </h2>
        {!addingNew && (
          <Button size="sm" variant="outline" onClick={() => setAddingNew(true)}>
            <Plus className="size-3.5" />
            Agregar producto
          </Button>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {items.length === 0 && !addingNew ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Sin productos registrados para este proveedor
          </p>
          <button
            onClick={() => setAddingNew(true)}
            className="mt-2 text-xs text-primary hover:underline"
          >
            Agregar el primero
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Descripción</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">Precio ref.</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Unidad</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Nota</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</th>
                <th className="w-20 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {/* Fila nueva */}
              {addingNew && (
                <tr className="bg-primary/3">
                  <td className="px-3 py-2">
                    <Input
                      autoFocus
                      value={newItem.descripcion}
                      onChange={(e) => setNewItem((p) => ({ ...p, descripcion: e.target.value }))}
                      placeholder="Ej: Plancha melamina 18mm blanco"
                      className="h-7 text-xs"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newItem.precioRef}
                      onChange={(e) => setNewItem((p) => ({ ...p, precioRef: e.target.value }))}
                      placeholder="0.00"
                      className="h-7 text-xs text-right"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Select value={newItem.unidad} onValueChange={(v) => setNewItem((p) => ({ ...p, unidad: v as UnidadMedida }))}>
                      <SelectTrigger className="h-7 text-xs w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIDAD_OPTIONS.map(([val, label]) => (
                          <SelectItem key={val} value={val} className="text-xs">{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={newItem.nota}
                      onChange={(e) => setNewItem((p) => ({ ...p, nota: e.target.value }))}
                      placeholder="Especificación…"
                      className="h-7 text-xs"
                    />
                  </td>
                  <td />
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleAdd}
                        disabled={loading || !newItem.descripcion.trim() || !newItem.precioRef}
                        className="flex size-7 items-center justify-center rounded-md text-chart-2 hover:bg-chart-2/10 transition-colors disabled:opacity-30"
                      >
                        <Check className="size-3.5" />
                      </button>
                      <button
                        onClick={() => { setAddingNew(false); setNewItem(emptyEditing()) }}
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {items.map((item) =>
                editingId === item.id ? (
                  <tr key={item.id} className="bg-primary/3">
                    <td className="px-3 py-2">
                      <Input
                        autoFocus
                        value={editState.descripcion}
                        onChange={(e) => setEditState((p) => ({ ...p, descripcion: e.target.value }))}
                        className="h-7 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editState.precioRef}
                        onChange={(e) => setEditState((p) => ({ ...p, precioRef: e.target.value }))}
                        className="h-7 text-xs text-right"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Select value={editState.unidad} onValueChange={(v) => setEditState((p) => ({ ...p, unidad: v as UnidadMedida }))}>
                        <SelectTrigger className="h-7 text-xs w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIDAD_OPTIONS.map(([val, label]) => (
                            <SelectItem key={val} value={val} className="text-xs">{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={editState.nota}
                        onChange={(e) => setEditState((p) => ({ ...p, nota: e.target.value }))}
                        className="h-7 text-xs"
                      />
                    </td>
                    <td />
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          disabled={loading}
                          className="flex size-7 items-center justify-center rounded-md text-chart-2 hover:bg-chart-2/10 transition-colors disabled:opacity-30"
                        >
                          <Check className="size-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={item.id} className={cn('transition-colors duration-[120ms] hover:bg-muted/40', !item.vigente && 'opacity-50')}>
                    <td className="px-4 py-3 font-medium">{item.descripcion}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-mono text-sm">
                      S/ {formatPrecio(item.precioRef)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{UNIDAD_ABBR[item.unidad]}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{item.nota ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                        item.vigente ? 'bg-chart-2/10 text-chart-2' : 'bg-muted text-muted-foreground',
                      )}>
                        {item.vigente ? 'Vigente' : 'Obsoleto'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(item)}
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={loading}
                          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-30"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
