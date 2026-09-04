'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSession } from '@/lib/auth/session'
import { cn } from '@/lib/utils'
import { hoyLimaISO } from '@/lib/date/fecha-lima'
import { UNIDAD_LABELS } from '@/lib/inventario'
import type { Proyecto, Role, TipoRequerimiento, UnidadMedida } from '@/types/api'
import { EspecificacionModal, type EspecificacionData } from './EspecificacionModal'

interface LineaItem {
  descripcion: string
  cantidad: string
  unidad: string
  especificacion: EspecificacionData | null
}

interface Props {
  proyectos: Proyecto[]
}

const labelCn = 'mb-1.5 block text-[13px] font-medium'
const sectionTitleCn = 'text-sm font-medium uppercase tracking-wide text-muted-foreground'
const emptyLinea = (): LineaItem => ({ descripcion: '', cantidad: '', unidad: 'und', especificacion: null })

const UNIDAD_GROUPS: Array<{ label: string; values: UnidadMedida[] }> = [
  { label: 'Uso general', values: ['und', 'pieza', 'par', 'juego', 'global'] },
  { label: 'Dimensiones', values: ['m', 'm2', 'm3'] },
  { label: 'Peso', values: ['kg', 'g'] },
  { label: 'Líquidos', values: ['l', 'ml', 'gal'] },
  { label: 'Conteo por lote', values: ['docena', 'medio_ciento', 'ciento', 'medio_millar', 'millar'] },
  { label: 'Presentación y envase', values: ['bolsa', 'caja', 'rollo', 'balde', 'galonera', 'cilindro'] },
  { label: 'Formato de material', values: ['varilla', 'plancha', 'tubo'] },
]

const TIPO_LABELS: Record<TipoRequerimiento, string> = {
  civil: 'Req. Civil',
  electrico: 'Req. Eléctrico',
  seguridad: 'Req. Seguridad',
  administrativo: 'Req. Administrativo',
}

// Which tipos each role is allowed to create (must match backend ROLE_TIPOS)
const ROLE_TIPOS: Partial<Record<Role, TipoRequerimiento[]>> = {
  supervisor: ['civil', 'electrico', 'seguridad', 'administrativo'],
  supervisor_civil: ['civil', 'electrico', 'seguridad', 'administrativo'],
  supervisor_electrico: ['civil', 'electrico', 'seguridad', 'administrativo'],
  pdr: ['civil', 'electrico', 'seguridad', 'administrativo'],
  ing_civil: ['civil'],
  ing_electrico: ['electrico'],
  jefe_sig: ['seguridad'],
  logistica: ['civil', 'electrico', 'seguridad', 'administrativo'],
  administrador: ['civil', 'electrico', 'seguridad', 'administrativo'],
  admin_ti: ['civil', 'electrico', 'seguridad', 'administrativo'],
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
  const [specModalIndex, setSpecModalIndex] = useState<number | null>(null)

  function updateLinea(i: number, field: 'descripcion' | 'cantidad' | 'unidad', value: string) {
    setLineas((prev) => prev.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)))
    setErrors((prev) => { const next = { ...prev }; delete next[`linea_${i}_${field}`]; return next })
  }

  function setLineaEspecificacion(i: number, especificacion: EspecificacionData | null) {
    setLineas((prev) => prev.map((l, idx) => (idx === i ? { ...l, especificacion } : l)))
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
          nota: l.especificacion?.descripcion || undefined,
          archivos: l.especificacion?.archivos ?? [],
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
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        <section className="space-y-4 border-r pr-4">
          <h2 className={sectionTitleCn}>Información general</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
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
                  <SelectValue>
                    {(value: string | null) =>
                      proyectos.find((p) => p.id === value)?.nombre ?? 'Selecciona un proyecto…'
                    }
                  </SelectValue>
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
                    <SelectValue>
                      {(value: TipoRequerimiento | null) => (value ? TIPO_LABELS[value] : '')}
                    </SelectValue>
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
              <DatePicker
                value={fechaEntregaRequerida}
                onValueChange={setFechaEntregaRequerida}
                min={hoyLimaISO()}
                placeholder="Seleccionar fecha"
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

          <label className="flex items-center gap-2 cursor-pointer w-fit ml-auto">
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
          </div>

          <div className="space-y-2">
            <div className="hidden sm:grid grid-cols-[1fr_84px_126px_140px_32px] gap-2 px-1">
              <p className="text-[13px] text-muted-foreground font-medium">Descripción</p>
              <p className="text-[13px] text-muted-foreground font-medium">Cantidad</p>
              <p className="text-[13px] text-muted-foreground font-medium">Unidad</p>
              <p className="text-[13px] text-muted-foreground font-medium">Especificaciones</p>
              <div />
            </div>

            {lineas.map((linea, i) => (
              <ItemRow
                key={i}
                index={i}
                linea={linea}
                errors={errors}
                canRemove={lineas.length > 1}
                onChange={(field, value) => updateLinea(i, field, value)}
                onOpenSpec={() => setSpecModalIndex(i)}
                onRemove={() => setLineas((p) => p.filter((_, idx) => idx !== i))}
              />
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
      </div>




      {serverError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 border-border pt-4">
        <Link href="/solicitudes" className={cn(buttonVariants({ variant: 'outline' }), "mr-auto")}>
          Cancelar
        </Link>
        {/* <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={(e) => handleSubmit(e, false)}
        >
          Guardar borrador
        </Button> */}
        <Button
          type="button"
          disabled={loading}
          className="min-w-32"
          onClick={(e) => handleSubmit(e, true)}
        >
          {loading ? 'Enviando…' : 'Crear y enviar'}
        </Button>
      </div>

      <EspecificacionModal
        open={specModalIndex !== null}
        onOpenChange={(o) => !o && setSpecModalIndex(null)}
        initial={specModalIndex !== null ? lineas[specModalIndex].especificacion : null}
        onSave={(data) => {
          setLineaEspecificacion(specModalIndex!, data)
          setSpecModalIndex(null)
        }}
      />
    </form>
  )
}

interface ItemRowProps {
  index: number
  linea: LineaItem
  errors: Record<string, string>
  canRemove: boolean
  onChange: (field: 'descripcion' | 'cantidad' | 'unidad', value: string) => void
  onOpenSpec: () => void
  onRemove: () => void
}

// Below `sm` the 5-column grid (descripción/cantidad/unidad/especificaciones/quitar)
// can't fit — fixed-width columns don't shrink, so it forces horizontal scroll on
// phones. Below `sm` we stack the same fields as a card instead; from `sm` up we
// switch back to the single-row grid (same pattern as the column-header row above).
function ItemRow({ index, linea, errors, canRemove, onChange, onOpenSpec, onRemove }: ItemRowProps) {
  const descripcionError = errors[`linea_${index}_descripcion`]
  const cantidadError = errors[`linea_${index}_cantidad`]
  const specLabel = linea.especificacion
    ? `Especificación · ${linea.especificacion.archivos.length} archivo(s)`
    : '+ Agregar espec'

  return (
    <>
      {/* Mobile: stacked card */}
      <div className="space-y-2 rounded-lg border border-border p-3 sm:hidden">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Ítem {index + 1}</p>
          <button
            type="button"
            onClick={onRemove}
            disabled={!canRemove}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors duration-[120ms] disabled:pointer-events-none disabled:opacity-30"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>

        <div>
          <Input
            value={linea.descripcion}
            onChange={(e) => onChange('descripcion', e.target.value)}
            placeholder="Ej: Plancha melamina 18mm blanco…"
            className={cn(descripcionError && 'border-destructive')}
          />
        </div>

        <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-2">
          <div>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={linea.cantidad}
              onChange={(e) => onChange('cantidad', e.target.value)}
              placeholder="Cantidad"
              className={cn(cantidadError && 'border-destructive')}
            />
          </div>

          <Select value={linea.unidad} onValueChange={(v) => onChange('unidad', v ?? 'und')}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-fit">
              {UNIDAD_GROUPS.map((group) => (
                <SelectGroup key={group.label}>
                  <SelectLabel>{group.label}</SelectLabel>
                  {group.values.map((value) => (
                    <SelectItem key={value} value={value} showIndicator={false}>
                      {UNIDAD_LABELS[value]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          type="button"
          onClick={onOpenSpec}
          className="flex h-8 w-full items-center rounded-lg border border-dashed border-border px-2.5 text-left text-xs text-muted-foreground hover:border-ring hover:text-foreground transition-colors duration-[120ms] truncate"
        >
          {specLabel}
        </button>
      </div>

      {/* sm and up: single-row grid, matches the column-header row */}
      <div className="hidden sm:grid grid-cols-[1fr_84px_126px_140px_32px] gap-2 items-start">
        <div>
          <Input
            value={linea.descripcion}
            onChange={(e) => onChange('descripcion', e.target.value)}
            placeholder="Ej: Plancha melamina 18mm blanco…"
            className={cn(descripcionError && 'border-destructive')}
          />
        </div>

        <div>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={linea.cantidad}
            onChange={(e) => onChange('cantidad', e.target.value)}
            placeholder="0"
            className={cn(cantidadError && 'border-destructive')}
          />
        </div>

        <Select value={linea.unidad} onValueChange={(v) => onChange('unidad', v ?? 'und')}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-44">
            {UNIDAD_GROUPS.map((group) => (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.values.map((value) => (
                  <SelectItem key={value} value={value} showIndicator={false}>
                    {UNIDAD_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        <button
          type="button"
          onClick={onOpenSpec}
          className="flex h-8 items-center rounded-lg border border-dashed border-border px-2.5 text-left text-xs text-muted-foreground hover:border-ring hover:text-foreground transition-colors duration-[120ms] truncate"
        >
          {specLabel}
        </button>

        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="mt-1 flex size-8 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors duration-[120ms] disabled:pointer-events-none disabled:opacity-30"
        >
          <Trash2 className="size-3.5 mb-3.5" />
        </button>
      </div>
    </>
  )
}
