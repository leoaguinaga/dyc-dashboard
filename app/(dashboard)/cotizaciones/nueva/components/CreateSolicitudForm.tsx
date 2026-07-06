'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProveedorMultiCombobox } from '@/components/ui/proveedor-multi-combobox'
import { cn } from '@/lib/utils'
import type { Proveedor, Requerimiento, TipoRequerimiento, UnidadMedida } from '@/types/api'

const UNIDADES: UnidadMedida[] = ['und', 'kg', 'm', 'm2', 'm3', 'l', 'gal', 'bolsa', 'caja', 'rollo', 'par', 'juego']

interface LineaItem {
  descripcion: string
  unidad: UnidadMedida
  cantidadTotal: string
  cantidadAlmacen: string
}

interface Props {
  requerimientos: Requerimiento[]
  proveedores: Proveedor[]
  requerimientoInicial: Requerimiento | null
}

const sectionTitleCn = 'text-xs font-medium uppercase tracking-wide text-muted-foreground'
const labelCn = 'mb-1.5 block text-sm font-medium'

const TIPO_LABEL: Record<TipoRequerimiento, string> = {
  civil: 'Civil', electrico: 'Eléctrico', seguridad: 'Seguridad', administrativo: 'Administrativo',
}
const TIPO_CLASS: Record<TipoRequerimiento, string> = {
  civil: 'bg-blue-500/10 text-blue-600',
  electrico: 'bg-amber-500/10 text-amber-600',
  seguridad: 'bg-orange-500/10 text-orange-600',
  administrativo: 'bg-purple-500/10 text-purple-600',
}

function emptyLinea(): LineaItem {
  return { descripcion: '', unidad: 'und', cantidadTotal: '', cantidadAlmacen: '0' }
}

function lineasFromRequerimiento(req: Requerimiento): LineaItem[] {
  if (req.items.length === 0) return [emptyLinea()]
  return req.items.map((item) => ({
    descripcion: item.descripcion,
    unidad: item.unidad,
    cantidadTotal: item.cantidad,
    cantidadAlmacen: '0',
  }))
}

export function CreateSolicitudForm({ requerimientos, proveedores, requerimientoInicial }: Props) {
  const router = useRouter()
  const [requerimiento, setRequerimiento] = useState<Requerimiento | null>(requerimientoInicial)
  const [nota, setNota] = useState('')
  const [lineas, setLineas] = useState<LineaItem[]>(
    requerimientoInicial ? lineasFromRequerimiento(requerimientoInicial) : [emptyLinea()]
  )
  const [selectedProveedores, setSelectedProveedores] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function selectRequerimiento(id: string) {
    const req = requerimientos.find((r) => r.id === id) ?? null
    setRequerimiento(req)
    setLineas(req ? lineasFromRequerimiento(req) : [emptyLinea()])
    setErrors((p) => { const n = { ...p }; delete n.requerimientoId; return n })
  }

  function updateLinea<K extends keyof LineaItem>(i: number, field: K, value: LineaItem[K]) {
    setLineas((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)))
    setErrors((prev) => { const next = { ...prev }; delete next[`linea_${i}_${field}`]; return next })
  }

  function toggleProveedor(id: string) {
    setSelectedProveedores((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setErrors((prev) => { const next = { ...prev }; delete next.proveedores; return next })
  }

  function validate() {
    const next: Record<string, string> = {}
    if (!requerimiento) next.requerimientoId = 'Selecciona un requerimiento aprobado'
    if (selectedProveedores.size < 2) next.proveedores = 'Selecciona al menos 2 proveedores'
    lineas.forEach((l, i) => {
      if (!l.descripcion.trim()) next[`linea_${i}_descripcion`] = 'Requerido'
      const total = parseFloat(l.cantidadTotal)
      if (!l.cantidadTotal || isNaN(total) || total <= 0) next[`linea_${i}_cantidadTotal`] = 'Requerido'
    })
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError(null)
    try {
      const result = await api.post<{ id: string }>('/solicitudes-cotizacion', {
        requerimientoId: requerimiento!.id,
        nota: nota.trim() || undefined,
        proveedorIds: Array.from(selectedProveedores),
        items: lineas.map((l) => ({
          descripcion: l.descripcion.trim(),
          unidad: l.unidad,
          cantidadTotal: parseFloat(l.cantidadTotal),
          cantidadAlmacen: parseFloat(l.cantidadAlmacen) || 0,
        })),
      })
      router.push(`/cotizaciones/${result.id}`)
      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al crear la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Requerimiento */}
      <section className="space-y-3">
        <h2 className={sectionTitleCn}>Requerimiento aprobado <span className="text-destructive">*</span></h2>

        {requerimientoInicial ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-4 py-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-medium">{requerimientoInicial.codigo}</span>
                <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium', TIPO_CLASS[requerimientoInicial.tipo])}>
                  {TIPO_LABEL[requerimientoInicial.tipo]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{requerimientoInicial.proyecto.nombre}</p>
            </div>
          </div>
        ) : (
          <>
            <Select value={requerimiento?.id ?? ''} onValueChange={(v) => v && selectRequerimiento(v)}>
              <SelectTrigger className={cn('w-full', errors.requerimientoId && 'border-destructive')}>
                <SelectValue placeholder="Selecciona un requerimiento aprobado…" />
              </SelectTrigger>
              <SelectContent>
                {requerimientos.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                    No hay requerimientos aprobados pendientes de cotizar
                  </div>
                ) : (
                  requerimientos.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      <span className="font-mono text-xs mr-1.5">{r.codigo}</span>
                      {r.proyecto.nombre}
                      <span className={cn('ml-2 inline-flex items-center rounded px-1 text-xs font-medium', TIPO_CLASS[r.tipo])}>
                        {TIPO_LABEL[r.tipo]}
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.requerimientoId && <p className="text-xs text-destructive">{errors.requerimientoId}</p>}
          </>
        )}
      </section>

      {/* Nota */}
      <section>
        <label className={labelCn}>Nota (opcional)</label>
        <Input
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Observaciones para esta solicitud…"
        />
      </section>

      {/* Proveedores */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className={sectionTitleCn}>Proveedores a cotizar <span className="text-destructive">*</span></h2>
          <span className={cn('text-xs', selectedProveedores.size >= 2 ? 'text-chart-2' : 'text-muted-foreground')}>
            {selectedProveedores.size} seleccionados (mínimo 2)
          </span>
        </div>
        {errors.proveedores && <p className="text-xs text-destructive">{errors.proveedores}</p>}
        {proveedores.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No hay proveedores activos.{' '}
            <Link href="/proveedores/nuevo" className="text-primary hover:underline">Registrar proveedor</Link>
          </p>
        ) : (
          <ProveedorMultiCombobox
            proveedores={proveedores}
            selected={selectedProveedores}
            onToggle={toggleProveedor}
            error={!!errors.proveedores}
          />
        )}
      </section>

      {/* Ítems */}
      <section className="space-y-3">
        <h2 className={sectionTitleCn}>Materiales / servicios a cotizar</h2>

        <div className="space-y-2">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-[1fr_80px_100px_100px_32px] gap-2 px-1">
            <p className="text-xs text-muted-foreground font-medium">Descripción</p>
            <p className="text-xs text-muted-foreground font-medium">Unidad</p>
            <p className="text-xs text-muted-foreground font-medium">Cant. total</p>
            <p className="text-xs text-muted-foreground font-medium">Del almacén</p>
            <div />
          </div>

          {lineas.map((linea, i) => {
            const cantidadCompra = parseFloat(linea.cantidadTotal || '0') - parseFloat(linea.cantidadAlmacen || '0')
            return (
              <div key={i} className="grid grid-cols-[1fr_80px_100px_100px_32px] gap-2 items-start">
                <div>
                  <Input
                    value={linea.descripcion}
                    onChange={(e) => updateLinea(i, 'descripcion', e.target.value)}
                    placeholder="Ej. Plancha de melamina 18mm"
                    className={cn(errors[`linea_${i}_descripcion`] && 'border-destructive')}
                  />
                  {errors[`linea_${i}_descripcion`] && (
                    <p className="mt-0.5 text-xs text-destructive">{errors[`linea_${i}_descripcion`]}</p>
                  )}
                </div>

                <Select value={linea.unidad} onValueChange={(v) => v && updateLinea(i, 'unidad', v as UnidadMedida)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIDADES.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div>
                  <Input
                    type="number" min="0.01" step="0.01"
                    value={linea.cantidadTotal}
                    onChange={(e) => updateLinea(i, 'cantidadTotal', e.target.value)}
                    placeholder="0"
                    className={cn(errors[`linea_${i}_cantidadTotal`] && 'border-destructive')}
                  />
                  {errors[`linea_${i}_cantidadTotal`] && (
                    <p className="mt-0.5 text-xs text-destructive">{errors[`linea_${i}_cantidadTotal`]}</p>
                  )}
                </div>

                <div>
                  <Input
                    type="number" min="0" step="0.01"
                    value={linea.cantidadAlmacen}
                    onChange={(e) => updateLinea(i, 'cantidadAlmacen', e.target.value)}
                    placeholder="0"
                  />
                  {cantidadCompra > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Comprar: <span className="font-medium tabular-nums">{cantidadCompra.toFixed(2)}</span>
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setLineas((p) => p.filter((_, idx) => idx !== i))}
                  disabled={lineas.length === 1}
                  className="mt-1 flex size-8 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors duration-[120ms] disabled:pointer-events-none disabled:opacity-30"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => setLineas((p) => [...p, emptyLinea()])}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2.5 text-sm text-muted-foreground hover:border-ring hover:text-foreground transition-colors duration-[120ms]"
        >
          <Plus className="size-4" />Agregar otro ítem
        </button>
      </section>

      {serverError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Link
          href={requerimiento ? `/requerimientos/${requerimiento.id}` : '/cotizaciones'}
          className={buttonVariants({ variant: 'outline' })}
        >
          Cancelar
        </Link>
        <Button type="submit" disabled={loading || !requerimiento} className="min-w-52">
          {loading ? 'Creando…' : `Crear y enviar a ${selectedProveedores.size || '…'} proveedores`}
        </Button>
      </div>
    </form>
  )
}
