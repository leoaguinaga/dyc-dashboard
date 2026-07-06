'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSession } from '@/lib/auth/session'
import { cn } from '@/lib/utils'
import { UNIDAD_OPTIONS } from '@/lib/inventario'
import type { Proyecto, Role, TipoRequerimiento } from '@/types/api'

interface LineaItem {
  descripcion: string
  cantidad: string
  unidad: string
  nota: string
}

interface Props {
  proyectos: Proyecto[]
}

const labelCn = 'mb-1.5 block text-sm font-medium'
const sectionTitleCn = 'text-xs font-medium uppercase tracking-wide text-muted-foreground'
const emptyLinea = (): LineaItem => ({ descripcion: '', cantidad: '', unidad: 'und', nota: '' })

const TIPO_LABELS: Record<TipoRequerimiento, string> = {
  civil:          'Req. Civil',
  electrico:      'Req. Eléctrico',
  seguridad:      'Req. Seguridad',
  administrativo: 'Req. Administrativo',
}

// Which tipos each role is allowed to create (must match backend ROLE_TIPOS)
const ROLE_TIPOS: Partial<Record<Role, TipoRequerimiento[]>> = {
  supervisor:           ['civil'],
  supervisor_civil:     ['civil'],
  supervisor_electrico: ['electrico'],
  pdr:                  ['seguridad'],
  ing_civil:            ['civil'],
  ing_electrico:        ['electrico'],
  jefe_sig:             ['seguridad'],
  logistica:            ['civil', 'electrico', 'seguridad', 'administrativo'],
  administrador:        ['civil', 'electrico', 'seguridad', 'administrativo'],
}

export function CreateRequerimientoForm({ proyectos }: Props) {
  const { data: session } = useSession()
  const role = (session?.user as { role?: Role } | undefined)?.role
  const allowedTipos = (role ? ROLE_TIPOS[role] : undefined) ?? []

  // If role only allows one tipo, pre-select it
  const [tipo, setTipo] = useState<TipoRequerimiento>(
    allowedTipos.length === 1 ? allowedTipos[0] : 'civil',
  )
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [proyectoId, setProyectoId] = useState('')
  const [urgente, setUrgente] = useState(false)
  const [nota, setNota] = useState('')
  const [fechaEntregaRequerida, setFechaEntregaRequerida] = useState('')
  const [lineas, setLineas] = useState<LineaItem[]>([emptyLinea()])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function updateLinea(i: number, field: keyof LineaItem, value: string) {
    setLineas((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)))
    setErrors((prev) => { const next = { ...prev }; delete next[`linea_${i}_${field}`]; return next })
  }

  function validate() {
    const next: Record<string, string> = {}
    if (!nombre.trim()) next.nombre = 'Ingresa un nombre'
    if (!proyectoId) next.proyectoId = 'Selecciona un proyecto'
    if (!tipo) next.tipo = 'Selecciona el tipo de requerimiento'
    lineas.forEach((l, i) => {
      if (!l.descripcion.trim()) next[`linea_${i}_descripcion`] = 'Ingresa una descripción'
      const qty = parseFloat(l.cantidad)
      if (!l.cantidad || isNaN(qty) || qty <= 0) next[`linea_${i}_cantidad`] = 'Ingresa la cantidad'
    })
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent, sendNow: boolean) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError(null)

    try {
      const result = await api.post<{ id: string }>('/requerimientos', {
        nombre: nombre.trim(),
        proyectoId,
        tipo,
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

      if (sendNow) {
        await api.post(`/requerimientos/${result.id}/enviar`, {})
      }

      router.push(`/requerimientos/${result.id}`)
      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al crear el requerimiento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-6">
      {/* General */}
      <section className="space-y-4">
        <h2 className={sectionTitleCn}>Información general</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-4">
            <label className={labelCn}>
              Nombre <span className="text-destructive">*</span>
            </label>
            <Input
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setErrors((p) => { const n = { ...p }; delete n.nombre; return n }) }}
              placeholder="Ej: Pintura para fachada principal"
              className={cn(errors.nombre && 'border-destructive')}
            />
            {errors.nombre && <p className="mt-1 text-xs text-destructive">{errors.nombre}</p>}
          </div>

          <div>
            <label className={labelCn}>
              Proyecto <span className="text-destructive">*</span>
            </label>
            <Select value={proyectoId} onValueChange={(v) => { setProyectoId(v ?? ''); setErrors((p) => { const n = { ...p }; delete n.proyectoId; return n }) }}>
              <SelectTrigger className={cn('w-full', errors.proyectoId && 'border-destructive')}>
                <SelectValue placeholder="Selecciona un proyecto…" />
              </SelectTrigger>
              <SelectContent>
                {proyectos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre}
                    {p.codigo && <span className="ml-1 text-muted-foreground font-mono text-xs">({p.codigo})</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.proyectoId && <p className="mt-1 text-xs text-destructive">{errors.proyectoId}</p>}
          </div>

          <div>
            <label className={labelCn}>
              Tipo <span className="text-destructive">*</span>
            </label>
            {allowedTipos.length <= 1 ? (
              // Role is fixed to one tipo — show as read-only badge
              <div className="flex h-9 items-center rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground">
                {TIPO_LABELS[tipo]}
              </div>
            ) : (
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoRequerimiento)}>
                <SelectTrigger className={cn('w-full', errors.tipo && 'border-destructive')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowedTipos.map((t) => (
                    <SelectItem key={t} value={t}>{TIPO_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.tipo && <p className="mt-1 text-xs text-destructive">{errors.tipo}</p>}
          </div>

          <div>
            <label className={labelCn}>Fecha máx. de entrega</label>
            <Input
              type="date"
              value={fechaEntregaRequerida}
              onChange={(e) => setFechaEntregaRequerida(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
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
      </section>

      {/* Líneas */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className={sectionTitleCn}>Materiales / equipos solicitados</h2>
          <button
            type="button"
            onClick={() => setLineas((p) => [...p, emptyLinea()])}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors duration-[120ms]"
          >
            <Plus className="size-3.5" />
            Agregar ítem
          </button>
        </div>

        <div className="space-y-2">
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
                  placeholder="Ej: Plancha melamina 18mm blanco…"
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
                  placeholder="0"
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

        <button
          type="button"
          onClick={() => setLineas((p) => [...p, emptyLinea()])}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2.5 text-sm text-muted-foreground hover:border-ring hover:text-foreground transition-colors duration-[120ms]"
        >
          <Plus className="size-4" />
          Agregar otro ítem
        </button>
      </section>

      {serverError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        <Link href="/requerimientos" className={buttonVariants({ variant: 'outline' })}>
          Cancelar
        </Link>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={(e) => handleSubmit(e, false)}
        >
          Guardar borrador
        </Button>
        <Button
          type="button"
          disabled={loading}
          className="min-w-32"
          onClick={(e) => handleSubmit(e, true)}
        >
          {loading ? 'Enviando…' : 'Crear y enviar'}
        </Button>
      </div>
    </form>
  )
}
