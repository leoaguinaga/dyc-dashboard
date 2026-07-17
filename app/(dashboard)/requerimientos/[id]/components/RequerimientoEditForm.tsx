'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { UNIDAD_OPTIONS } from '@/lib/inventario'
import type { Requerimiento } from '@/types/api'

interface LineaItem {
  descripcion: string
  cantidad: string
  unidad: string
  nota: string
}

interface Props {
  requerimiento: Requerimiento
  mode?: 'creador' | 'revisor'
}

const labelCn = 'mb-1.5 block text-sm font-medium'

function toLineas(r: Requerimiento): LineaItem[] {
  return r.items.map((i) => ({
    descripcion: i.descripcion,
    cantidad: String(i.cantidad),
    unidad: i.unidad,
    nota: i.nota ?? '',
  }))
}

export function RequerimientoEditForm({ requerimiento: r, mode = 'creador' }: Props) {
  const router = useRouter()
  const [nombre, setNombre] = useState(r.nombre)
  const [urgente, setUrgente] = useState(r.urgente)
  const [nota, setNota] = useState(r.nota ?? '')
  const [fechaEntregaRequerida, setFechaEntregaRequerida] = useState(
    r.fechaEntregaRequerida ? r.fechaEntregaRequerida.slice(0, 10) : '',
  )
  const [lineas, setLineas] = useState<LineaItem[]>(toLineas(r))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState<'guardar' | 'reenviar' | null>(null)

  function updateLinea(i: number, field: keyof LineaItem, value: string) {
    setLineas((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)))
    setErrors((prev) => { const next = { ...prev }; delete next[`linea_${i}_${field}`]; return next })
  }

  function validate() {
    const next: Record<string, string> = {}
    if (!nombre.trim()) next.nombre = 'Ingresa un nombre'
    lineas.forEach((l, i) => {
      if (!l.descripcion.trim()) next[`linea_${i}_descripcion`] = 'Ingresa una descripción'
      const qty = parseFloat(l.cantidad)
      if (!l.cantidad || isNaN(qty) || qty <= 0) next[`linea_${i}_cantidad`] = 'Ingresa la cantidad'
    })
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(reenviar: boolean) {
    if (!validate()) return
    setLoading(reenviar ? 'reenviar' : 'guardar')
    setServerError(null)

    try {
      await api.patch(`/requerimientos/${r.id}`, {
        nombre: nombre.trim(),
        urgente,
        nota: nota.trim() || undefined,
        fechaEntregaRequerida: fechaEntregaRequerida || undefined,
        items: lineas.map((l) => ({
          descripcion: l.descripcion.trim(),
          cantidad: parseFloat(l.cantidad),
          unidad: l.unidad,
          nota: l.nota.trim() || undefined,
        })),
      })

      if (reenviar && mode === 'creador') {
        await api.post(`/requerimientos/${r.id}/enviar`, {})
      }

      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al guardar los cambios')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {mode === 'revisor' ? 'Editar antes de decidir' : 'Corregir requerimiento observado'}
        </h2>
      </div>
      {mode === 'revisor' && (
        <p className="text-sm text-muted-foreground">
          Estás corrigiendo este requerimiento como revisor. El cambio queda registrado en el
          historial. Usa las acciones de aprobar u observar por separado para emitir tu decisión.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCn}>
            Nombre <span className="text-destructive">*</span>
          </label>
          <Input
            value={nombre}
            onChange={(e) => { setNombre(e.target.value); setErrors((p) => { const n = { ...p }; delete n.nombre; return n }) }}
            className={cn(errors.nombre && 'border-destructive')}
          />
          {errors.nombre && <p className="mt-1 text-xs text-destructive">{errors.nombre}</p>}
        </div>

        <div>
          <label className={labelCn}>Fecha máx. de entrega</label>
          <Input
            type="date"
            value={fechaEntregaRequerida}
            onChange={(e) => setFechaEntregaRequerida(e.target.value)}
          />
        </div>

        <div>
          <label className={labelCn}>Nota (opcional)</label>
          <Input
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Contexto o justificación…"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer w-fit">
        <input
          type="checkbox"
          checked={urgente}
          onChange={(e) => setUrgente(e.target.checked)}
          className="size-4 rounded border-border accent-primary"
        />
        <span className="text-sm font-medium">Marcar como urgente</span>
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Materiales / equipos solicitados
          </p>
          <button
            type="button"
            onClick={() => setLineas((p) => [...p, { descripcion: '', cantidad: '', unidad: 'und', nota: '' }])}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors duration-[120ms]"
          >
            <Plus className="size-3.5" />
            Agregar ítem
          </button>
        </div>

        <div className="hidden sm:grid grid-cols-[1fr_100px_110px_140px_32px] gap-2 px-1">
          <p className="text-xs text-muted-foreground font-medium">Descripción</p>
          <p className="text-xs text-muted-foreground font-medium">Cantidad</p>
          <p className="text-xs text-muted-foreground font-medium">Unidad</p>
          <p className="text-xs text-muted-foreground font-medium">Nota (opcional)</p>
          <div />
        </div>

        {lineas.map((linea, i) => (
          <div key={i} className="grid grid-cols-[1fr_100px_110px_140px_32px] gap-2 items-start">
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

            <Select value={linea.unidad} onValueChange={(v) => updateLinea(i, 'unidad', v ?? 'und')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIDAD_OPTIONS.map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={linea.nota}
              onChange={(e) => updateLinea(i, 'nota', e.target.value)}
              placeholder="Especificación…"
            />

            <button
              type="button"
              onClick={() => setLineas((p) => p.filter((_, idx) => idx !== i))}
              disabled={lineas.length === 1}
              className="mt-1 flex size-8 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors duration-[120ms] disabled:pointer-events-none disabled:opacity-30"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      {serverError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        <Button
          type="button"
          variant={mode === 'revisor' ? 'default' : 'outline'}
          disabled={loading !== null}
          onClick={() => handleSubmit(false)}
        >
          {loading === 'guardar' ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        {mode === 'creador' && (
          <Button
            type="button"
            disabled={loading !== null}
            className="min-w-32"
            onClick={() => handleSubmit(true)}
          >
            {loading === 'reenviar' ? 'Reenviando…' : 'Guardar y reenviar'}
          </Button>
        )}
      </div>
    </div>
  )
}
