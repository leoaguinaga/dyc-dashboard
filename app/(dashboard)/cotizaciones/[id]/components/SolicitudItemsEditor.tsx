'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import type { EstadoSolicitud, Role, SolicitudItem } from '@/types/api'

interface Props {
  solicitudId: string
  estado: EstadoSolicitud
  items: SolicitudItem[]
  nota?: string | null
  role?: Role
}

const ROLES_GERENCIA: Role[] = ['gerencia', 'administrador', 'admin_ti']
const ROLES_EDITORES: Role[] = ['logistica', ...ROLES_GERENCIA]

interface EditRow {
  descripcion: string
  unidad: string
  cantidadTotal: string
  cantidadAlmacen: string
}

function toRows(items: SolicitudItem[]): EditRow[] {
  return items.map((i) => ({
    descripcion: i.descripcion,
    unidad: i.unidad,
    cantidadTotal: i.cantidadTotal,
    cantidadAlmacen: i.cantidadAlmacen,
  }))
}

export function SolicitudItemsEditor({ solicitudId, estado, items, nota, role }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [rows, setRows] = useState<EditRow[]>(() => toRows(items))
  const [notaEdit, setNotaEdit] = useState(nota ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debe coincidir con las reglas de CotizacionesService.updateSolicitud:
  // no editable en orden_generada/cancelada; en aprobada_gerencia solo gerencia/admin.
  const puedeEditar = !!role && ROLES_EDITORES.includes(role) &&
    estado !== 'orden_generada' && estado !== 'cancelada' &&
    (estado !== 'aprobada_gerencia' || ROLES_GERENCIA.includes(role))

  function startEdit() {
    setRows(toRows(items))
    setNotaEdit(nota ?? '')
    setError(null)
    setEditing(true)
  }

  function updateRow(idx: number, patch: Partial<EditRow>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  function addRow() {
    setRows((prev) => [...prev, { descripcion: '', unidad: 'und', cantidadTotal: '', cantidadAlmacen: '0' }])
  }

  function removeRow(idx: number) {
    setRows((prev) => prev.filter((_, i) => i !== idx))
  }

  async function save() {
    setError(null)
    if (rows.length === 0) {
      setError('Debe haber al menos un ítem')
      return
    }
    for (const r of rows) {
      if (!r.descripcion.trim() || !r.cantidadTotal || Number(r.cantidadTotal) <= 0) {
        setError('Cada ítem necesita descripción y cantidad total mayor a 0')
        return
      }
    }
    setLoading(true)
    try {
      await api.patch(`/solicitudes-cotizacion/${solicitudId}`, {
        nota: notaEdit.trim() || undefined,
        items: rows.map((r) => ({
          descripcion: r.descripcion.trim(),
          unidad: r.unidad,
          cantidadTotal: Number(r.cantidadTotal),
          cantidadAlmacen: Number(r.cantidadAlmacen) || 0,
        })),
      })
      setEditing(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar los cambios')
    } finally {
      setLoading(false)
    }
  }

  if (!editing) {
    return puedeEditar ? (
      <Button
        size="sm"
        variant="outline"
        className="w-full"
        onClick={startEdit}
      >
        <Pencil className="size-3.5" />
        Editar solicitud
      </Button>
    ) : null
  }

  return (
    <div className="space-y-3 border-t border-border pt-3">
      <div className="space-y-2">
        {rows.map((r, idx) => (
          <div key={idx} className="flex items-start gap-1.5 rounded-lg border border-border p-2">
            <div className="flex-1 space-y-1.5">
              <input
                value={r.descripcion}
                onChange={(e) => updateRow(idx, { descripcion: e.target.value })}
                placeholder="Descripción"
                className="w-full rounded-md border border-border px-2 py-1 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={r.cantidadTotal}
                  onChange={(e) => updateRow(idx, { cantidadTotal: e.target.value })}
                  placeholder="Cant. total"
                  className="w-24 rounded-md border border-border px-2 py-1 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={r.cantidadAlmacen}
                  onChange={(e) => updateRow(idx, { cantidadAlmacen: e.target.value })}
                  placeholder="En almacén"
                  className="w-24 rounded-md border border-border px-2 py-1 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
                <input
                  value={r.unidad}
                  onChange={(e) => updateRow(idx, { unidad: e.target.value })}
                  placeholder="Unidad"
                  className="w-16 rounded-md border border-border px-2 py-1 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeRow(idx)}
              className="mt-1 shrink-0 rounded-md p-1 text-muted-foreground transition-colors duration-[120ms] hover:bg-destructive/10 hover:text-destructive"
              aria-label="Quitar ítem"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      <Button size="sm" variant="outline" className="w-full" onClick={addRow}>
        <Plus className="size-3.5" />
        Agregar ítem
      </Button>

      <textarea
        value={notaEdit}
        onChange={(e) => setNotaEdit(e.target.value)}
        placeholder="Nota (opcional)…"
        rows={2}
        className="w-full rounded-lg border border-border px-3 py-2 text-xs placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20 resize-none"
      />

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          disabled={loading}
          onClick={() => setEditing(false)}
        >
          Cancelar
        </Button>
        <Button
          size="sm"
          className="flex-1"
          disabled={loading}
          onClick={save}
        >
          {loading ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  )
}
