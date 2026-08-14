'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, X } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useSession } from '@/lib/auth/session'
import type { OrdenCompra, Role, TipoRequerimiento } from '@/types/api'

// Espejo de TIPO_APPROVERS_TECNICO del backend
const TIPO_APPROVERS_TECNICO: Record<TipoRequerimiento, Role[]> = {
  civil: ['ing_civil', 'administrador', 'admin_ti'],
  electrico: ['ing_electrico', 'administrador', 'admin_ti'],
  seguridad: ['jefe_sig', 'administrador', 'admin_ti'],
  administrativo: ['logistica', 'administrador', 'admin_ti'],
}

interface LineaItem {
  id?: string
  descripcion: string
  cantidad: string
}

interface Props {
  grupo: OrdenCompra
  tipo: TipoRequerimiento
  esRendicion: boolean
}

function toLineas(g: OrdenCompra): LineaItem[] {
  return g.items.map((i) => ({ id: i.id, descripcion: i.descripcion, cantidad: String(i.cantidad) }))
}

export function GrupoEditarItemsForm({ grupo: g, tipo, esRendicion }: Props) {
  const { data: session } = useSession()
  const role = session?.user?.role as Role | undefined
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [lineas, setLineas] = useState<LineaItem[]>(() => toLineas(g))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const canEditar =
    !esRendicion &&
    g.estadoAprobacion !== 'aprobada' &&
    !!role &&
    TIPO_APPROVERS_TECNICO[tipo].includes(role)

  if (!canEditar) return null

  function updateLinea(i: number, field: keyof LineaItem, value: string) {
    setLineas((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)))
    setErrors((prev) => { const next = { ...prev }; delete next[`linea_${i}_${field}`]; return next })
  }

  function validate() {
    const next: Record<string, string> = {}
    lineas.forEach((l, i) => {
      if (!l.descripcion.trim()) next[`linea_${i}_descripcion`] = 'Ingresa un nombre'
      const qty = parseFloat(l.cantidad)
      if (!l.cantidad || isNaN(qty) || qty <= 0) next[`linea_${i}_cantidad`] = 'Ingresa la cantidad'
    })
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    setLoading(true)
    setServerError(null)
    try {
      await api.patch(`/compras-simples/grupos/${g.id}/items`, {
        items: lineas.map((l) => ({
          id: l.id,
          descripcion: l.descripcion.trim(),
          cantidad: parseFloat(l.cantidad),
        })),
      })
      setEditing(false)
      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al guardar los cambios')
    } finally {
      setLoading(false)
    }
  }

  if (!editing) {
    return (
      <div className="border-t border-border pt-3">
        <button
          type="button"
          onClick={() => { setLineas(toLineas(g)); setEditing(true) }}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-[120ms]"
        >
          <Pencil className="size-3.5" />
          Editar cantidad / nombre de ítems
        </button>
      </div>
    )
  }

  return (
    <div className="border-t border-border pt-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Editar ítems (área técnica)
        </h3>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-muted-foreground hover:text-foreground transition-colors duration-[120ms]"
        >
          <X className="size-4" />
        </button>
      </div>
      <p className="text-sm text-muted-foreground">
        Solo puedes corregir el nombre y la cantidad. El cambio queda registrado en el historial.
      </p>

      <div className="space-y-2">
        {lineas.map((linea, i) => (
          <div key={linea.id ?? i} className="grid grid-cols-[1fr_100px] gap-2 items-start">
            <div>
              <Input
                value={linea.descripcion}
                onChange={(e) => updateLinea(i, 'descripcion', e.target.value)}
                className={cn(errors[`linea_${i}_descripcion`] && 'border-destructive')}
              />
              {errors[`linea_${i}_descripcion`] && (
                <p className="mt-0.5 text-xs text-destructive">{errors[`linea_${i}_descripcion`]}</p>
              )}
            </div>
            <div>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={linea.cantidad}
                onChange={(e) => updateLinea(i, 'cantidad', e.target.value)}
                className={cn(errors[`linea_${i}_cantidad`] && 'border-destructive')}
              />
              {errors[`linea_${i}_cantidad`] && (
                <p className="mt-0.5 text-xs text-destructive">{errors[`linea_${i}_cantidad`]}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {serverError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={loading} onClick={() => setEditing(false)}>
          Cancelar
        </Button>
        <Button type="button" disabled={loading} onClick={handleSubmit}>
          {loading ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </div>
  )
}
