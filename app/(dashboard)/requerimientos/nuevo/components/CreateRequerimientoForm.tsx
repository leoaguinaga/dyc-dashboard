'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ClipboardPaste, Paperclip, Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Textarea } from '@/components/ui/textarea'
import { PrioridadSegmentada } from '@/components/requerimientos/PrioridadSegmentada'
import { PRIORIDAD_LABEL } from '@/lib/prioridad'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSession } from '@/lib/auth/session'
import { cn } from '@/lib/utils'
import { hoyLimaISO } from '@/lib/date/fecha-lima'
import { UNIDAD_LABELS } from '@/lib/inventario'
import { tipoEfectivo, tiposCreablesPorRol } from '@/lib/requerimientos'
import { esPegadoTabular, parsearPegado, type FilaPegada } from '@/lib/requerimientos-paste'
import type { PrioridadRequerimiento, Proyecto, Role, TipoRequerimiento, UnidadMedida } from '@/types/api'
import { EspecificacionModal, type EspecificacionArchivo, type EspecificacionData } from './EspecificacionModal'
import { PegarExcelModal } from './PegarExcelModal'

interface LineaItem {
  id: string
  descripcion: string
  cantidad: string
  /** Vacío cuando una unidad pegada no se reconoció y falta elegirla. */
  unidad: UnidadMedida | ''
  observacion: string
  archivos: EspecificacionArchivo[]
}

interface Props {
  proyectos: Proyecto[]
}

// Columnas navegables con teclado; la 2 es el select de unidad y se salta con flechas.
const COL_DESCRIPCION = 0
const COL_CANTIDAD = 1
const COL_UNIDAD = 2
const COL_OBSERVACION = 3

const labelCn = 'mb-1.5 block text-[13px] font-medium'
const cellCn =
  'h-8 text-sm md:border-transparent md:bg-transparent md:hover:border-input md:focus-visible:bg-white md:aria-invalid:border-destructive'

let lineaSeq = 0
const emptyLinea = (): LineaItem => ({
  id: `l${++lineaSeq}`,
  descripcion: '',
  cantidad: '',
  unidad: 'und',
  observacion: '',
  archivos: [],
})
const lineaVacia = (l: LineaItem) => !l.descripcion.trim() && !l.cantidad && !l.observacion.trim() && l.archivos.length === 0

function formatFechaResumen(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

const DRAFT_KEY = 'requerimientos-nuevo-draft'

interface Draft {
  proyectoId: string
  tipo: TipoRequerimiento | null
  prioridad?: PrioridadRequerimiento
  /** Borradores anteriores a la prioridad guardaban un booleano; `nombre` ya no se pide. */
  urgente?: boolean
  nombre?: string
  nota: string
  fechaEntregaRequerida: string
  lineas: Array<Partial<LineaItem> & { especificacion?: EspecificacionData | null }>
}

function loadDraft(): Draft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as Draft) : null
  } catch {
    return null
  }
}

function clearDraft() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(DRAFT_KEY)
}

// Los borradores guardados antes de la grilla traían `especificacion`; se mapean a observación + archivos.
function lineaDesdeDraft(l: Draft['lineas'][number]): LineaItem {
  return {
    ...emptyLinea(),
    descripcion: l.descripcion ?? '',
    cantidad: l.cantidad ?? '',
    unidad: l.unidad ?? 'und',
    observacion: l.observacion ?? l.especificacion?.descripcion ?? '',
    archivos: l.archivos ?? l.especificacion?.archivos ?? [],
  }
}

function lineaDesdePegado(f: FilaPegada): LineaItem {
  return {
    ...emptyLinea(),
    descripcion: f.descripcion,
    cantidad: f.cantidad,
    unidad: f.unidad ?? '',
    observacion: f.observacion,
  }
}

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
  civil: 'Requerimiento Civil',
  electrico: 'Requerimiento Eléctrico',
  seguridad: 'Requerimiento SSOMA',
  administrativo: 'Requerimiento Administrativo',
}

export function CreateRequerimientoForm({ proyectos }: Props) {
  const { data: session } = useSession()
  const role = (session?.user as { role?: Role } | undefined)?.role
  const allowedTipos = tiposCreablesPorRol(role)

  const [tipoElegido, setTipoElegido] = useState<TipoRequerimiento | null>(null)
  const tipo = tipoEfectivo(tipoElegido, allowedTipos)
  const router = useRouter()
  const [proyectoId, setProyectoId] = useState('')
  const [prioridad, setPrioridad] = useState<PrioridadRequerimiento>('normal')
  const [nota, setNota] = useState('')
  const [fechaEntregaRequerida, setFechaEntregaRequerida] = useState('')
  const [lineas, setLineas] = useState<LineaItem[]>(() => [emptyLinea()])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState<'borrador' | 'enviar' | null>(null)
  const [specLineaId, setSpecLineaId] = useState<string | null>(null)
  const [pegarOpen, setPegarOpen] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)
  const [aviso, setAviso] = useState<{ texto: string; deshacer?: () => void } | null>(null)
  const draftReady = useRef(false)
  const pendingFocus = useRef<{ row: number; col: number } | null>(null)
  const avisoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const draft = loadDraft()
    if (draft) {
      if (draft.proyectoId) setProyectoId(draft.proyectoId)
      if (draft.tipo) setTipoElegido(draft.tipo)
      setPrioridad(draft.prioridad ?? (draft.urgente ? 'urgente' : 'normal'))
      if (draft.nota) setNota(draft.nota)
      if (draft.fechaEntregaRequerida) setFechaEntregaRequerida(draft.fechaEntregaRequerida)
      if (draft.lineas && draft.lineas.length > 0) setLineas(draft.lineas.map(lineaDesdeDraft))

      const hasContent = !!(
        draft.proyectoId ||
        draft.nota ||
        draft.fechaEntregaRequerida ||
        draft.lineas?.some((l) => l.descripcion || l.cantidad)
      )
      if (hasContent) {
        setDraftRestored(true)
      }
    }
    draftReady.current = true
  }, [])

  useEffect(() => {
    if (!draftReady.current) return
    const hasContent = !!(
      proyectoId ||
      nota ||
      fechaEntregaRequerida ||
      prioridad !== 'normal' ||
      lineas.some((l) => !lineaVacia(l))
    )
    if (!hasContent) {
      clearDraft()
      return
    }
    const draft: Draft = {
      proyectoId,
      tipo,
      prioridad,
      nota,
      fechaEntregaRequerida,
      lineas,
    }
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }, [proyectoId, tipo, prioridad, nota, fechaEntregaRequerida, lineas])

  // Mueve el foco a la celda pedida una vez que React pintó las filas nuevas.
  useEffect(() => {
    const target = pendingFocus.current
    if (!target) return
    pendingFocus.current = null
    document.querySelector<HTMLElement>(`[data-cell="${target.row}-${target.col}"]`)?.focus()
  }, [lineas])

  function mostrarAviso(texto: string, deshacer?: () => void) {
    if (avisoTimer.current) clearTimeout(avisoTimer.current)
    setAviso({ texto, deshacer })
    avisoTimer.current = setTimeout(() => setAviso(null), 6000)
  }

  function discardDraft() {
    clearDraft()
    setProyectoId('')
    setTipoElegido(null)
    setPrioridad('normal')
    setNota('')
    setFechaEntregaRequerida('')
    setLineas([emptyLinea()])
    setDraftRestored(false)
  }

  function clearError(key: string) {
    setErrors((prev) => {
      if (!(key in prev)) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function updateLinea(id: string, patch: Partial<LineaItem>) {
    setLineas((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)))
    for (const field of Object.keys(patch)) clearError(`${id}:${field}`)
  }

  function agregarLinea(focusCol: number = COL_DESCRIPCION) {
    pendingFocus.current = { row: lineas.length, col: focusCol }
    setLineas((prev) => [...prev, emptyLinea()])
  }

  function eliminarLinea(index: number) {
    const eliminada = lineas[index]
    setLineas((prev) => {
      const next = prev.filter((_, i) => i !== index)
      return next.length ? next : [emptyLinea()]
    })
    mostrarAviso(`Ítem ${index + 1} eliminado`, () => {
      setLineas((prev) => {
        const base = prev.length === 1 && lineaVacia(prev[0]) ? [] : prev
        const next = [...base]
        next.splice(Math.min(index, next.length), 0, eliminada)
        return next
      })
      setAviso(null)
    })
  }

  // Inserta las filas pegadas: reemplaza la fila vacía donde estaba el cursor, o se agregan al final.
  function insertarFilas(filas: FilaPegada[], at: number | null) {
    const validas = filas.filter((f) => f.descripcion)
    if (validas.length === 0) return
    const nuevas = validas.map(lineaDesdePegado)
    const index = at ?? lineas.length - 1
    const reemplaza = lineas[index] && lineaVacia(lineas[index])
    const insertAt = reemplaza ? index : at === null ? lineas.length : index + 1

    setLineas((prev) => {
      const next = [...prev]
      next.splice(insertAt, reemplaza ? 1 : 0, ...nuevas)
      return next
    })
    pendingFocus.current = { row: insertAt + nuevas.length - 1, col: COL_DESCRIPCION }

    const sinUnidad = nuevas.filter((l) => l.unidad === '').length
    mostrarAviso(
      `${nuevas.length === 1 ? '1 fila agregada' : `${nuevas.length} filas agregadas`}` +
        (sinUnidad ? ` · ${sinUnidad === 1 ? '1 sin unidad' : `${sinUnidad} sin unidad`}, elígela en la tabla` : ''),
    )
  }

  function handlePasteDescripcion(e: React.ClipboardEvent<HTMLInputElement>, index: number) {
    const texto = e.clipboardData.getData('text')
    if (!esPegadoTabular(texto)) return
    e.preventDefault()
    insertarFilas(parsearPegado(texto), index)
  }

  function handleCellKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number, col: number) {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter') {
      e.preventDefault()
      if (index === lineas.length - 1) agregarLinea()
      else document.querySelector<HTMLElement>(`[data-cell="${index + 1}-${col}"]`)?.focus()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const target = document.querySelector<HTMLElement>(`[data-cell="${index + (e.key === 'ArrowDown' ? 1 : -1)}-${col}"]`)
      if (target) {
        e.preventDefault()
        target.focus()
      }
    }
  }

  function validate(sendNow: boolean) {
    const next: Record<string, string> = {}
    if (!proyectoId) next.proyectoId = 'Selecciona un proyecto'
    if (!tipo) next.tipo = 'Selecciona el tipo de requerimiento'
    // El borrador puede guardarse sin fecha; enviarlo no.
    if (sendNow && !fechaEntregaRequerida) next.fecha = 'Indica cuándo se necesita'
    lineas.forEach((l, i) => {
      if (!l.descripcion.trim()) next[`${l.id}:descripcion`] = `Ítem ${i + 1}: ingresa una descripción`
      const qty = parseFloat(l.cantidad)
      if (!l.cantidad || isNaN(qty) || qty <= 0) next[`${l.id}:cantidad`] = `Ítem ${i + 1}: ingresa la cantidad`
      if (!l.unidad) next[`${l.id}:unidad`] = `Ítem ${i + 1}: elige la unidad`
    })
    setErrors(next)
    if (Object.keys(next).length > 0) {
      requestAnimationFrame(() => {
        const first = document.querySelector<HTMLElement>('[aria-invalid="true"]')
        first?.scrollIntoView({ block: 'center', behavior: 'smooth' })
        first?.focus({ preventScroll: true })
      })
    }
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent, sendNow: boolean) {
    e.preventDefault()
    if (!validate(sendNow)) return
    setLoading(sendNow ? 'enviar' : 'borrador')
    setServerError(null)

    try {
      const result = await api.post<{ id: string }>('/requerimientos', {
        proyectoId,
        tipo,
        prioridad,
        nota: nota.trim() || undefined,
        fechaEntregaRequerida: fechaEntregaRequerida || undefined,
        items: lineas.map((l) => ({
          descripcion: l.descripcion.trim(),
          cantidad: parseFloat(l.cantidad),
          unidad: l.unidad,
          nota: l.observacion.trim() || undefined,
          archivos: l.archivos,
        })),
      })

      if (sendNow) {
        await api.post(`/requerimientos/${result.id}/enviar`, {})
      }

      clearDraft()
      router.push(`/requerimientos/${result.id}`)
      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al crear el requerimiento')
    } finally {
      setLoading(null)
    }
  }

  const specIndex = specLineaId ? lineas.findIndex((l) => l.id === specLineaId) : -1
  const specLinea = specIndex >= 0 ? lineas[specIndex] : null
  const conAdjunto = lineas.filter((l) => l.archivos.length > 0).length
  const itemsLlenos = lineas.filter((l) => !lineaVacia(l)).length
  const errorCount = Object.keys(errors).length
  const proyectoSel = proyectos.find((p) => p.id === proyectoId)
  const proyectoResumen = proyectoSel ? `${proyectoSel.codigo ? `${proyectoSel.codigo} · ` : ''}${proyectoSel.nombre}` : ''

  return (
    <form className="space-y-4" noValidate>
      {draftRestored && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-amber-700">
          <p>Se restauró un borrador que tenías sin enviar.</p>
          <button
            type="button"
            onClick={discardDraft}
            className="shrink-0 text-xs font-medium underline underline-offset-2 hover:text-amber-800"
          >
            Descartar
          </button>
        </div>
      )}

      {/* Información general */}
      <section aria-labelledby="req-general" className="rounded-xl border border-border bg-white p-4 sm:p-5">
        <h2 id="req-general" className="mb-4 text-sm font-medium">Información general</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-3">
            <label htmlFor="req-solicitante" className={labelCn}>Solicitante</label>
            <Input id="req-solicitante" readOnly value={session?.user?.name ?? ''} className="bg-muted/50 text-muted-foreground" />
          </div>
            <div className="sm:col-span-2 lg:col-span-5">
              <label htmlFor="req-proyecto" className={labelCn}>
                Proyecto / Centro de costos <span className="text-destructive">*</span>
              </label>
              <Select
                value={proyectoId}
                onValueChange={(v) => {
                  setProyectoId(v ?? '')
                  clearError('proyectoId')
                }}
              >
                <SelectTrigger
                  id="req-proyecto"
                  className={cn('w-full', errors.proyectoId && 'border-destructive')}
                  aria-invalid={!!errors.proyectoId}
                  aria-describedby={errors.proyectoId ? 'req-proyecto-error' : undefined}
                >
                  <SelectValue className="normal-case">
                    {(value: string | null) => {
                      const p = proyectos.find((proj) => proj.id === value)
                      if (!p) return 'Selecciona un proyecto…'
                      return `${p.codigo ? `${p.codigo} · ` : ''}${p.nombre}`
                    }}
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
              {errors.proyectoId && (
                <p id="req-proyecto-error" className="mt-1 text-xs text-destructive">
                  {errors.proyectoId}
                </p>
              )}
            </div>

            <div className="lg:col-span-4">
              <label htmlFor="req-tipo" className={labelCn}>
                Tipo <span className="text-destructive">*</span>
              </label>
              {allowedTipos.length <= 1 ? (
                // Role is fixed to one tipo — show as read-only badge
                <div
                  id="req-tipo"
                  className="flex h-8 items-center rounded-lg border border-border bg-muted/50 px-2.5 text-sm text-muted-foreground"
                >
                  {tipo ? TIPO_LABELS[tipo] : '—'}
                </div>
              ) : (
                <Select
                  value={tipo}
                  onValueChange={(v) => {
                    setTipoElegido(v as TipoRequerimiento)
                    clearError('tipo')
                  }}
                >
                  <SelectTrigger
                    id="req-tipo"
                    className={cn('w-full', errors.tipo && 'border-destructive')}
                    aria-invalid={!!errors.tipo}
                  >
                    <SelectValue>{(value: TipoRequerimiento | null) => (value ? TIPO_LABELS[value] : '')}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {allowedTipos.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TIPO_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.tipo && <p className="mt-1 text-xs text-destructive">{errors.tipo}</p>}
            </div>


          <div className="lg:col-span-4">
            <span id="req-fecha-label" className={labelCn}>
              Fecha requerida <span className="text-destructive">*</span>
            </span>
            <DatePicker
              value={fechaEntregaRequerida}
              onValueChange={(v) => {
                setFechaEntregaRequerida(v)
                clearError('fecha')
              }}
              min={hoyLimaISO()}
              placeholder="Seleccionar fecha"
              aria-invalid={!!errors.fecha}
            />
            {errors.fecha && (
              <p role="alert" className="mt-1 text-xs text-destructive">
                {errors.fecha}
              </p>
            )}
          </div>

          <div className="sm:col-span-2 lg:col-span-8">
            <span id="req-prioridad-label" className={labelCn}>Prioridad</span>
            <PrioridadSegmentada value={prioridad} onChange={setPrioridad} labelledBy="req-prioridad-label" className="max-w-md" />
          </div>
        </div>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="space-y-4">
          {/* Ítems */}
          <section className="rounded-xl border border-border bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-1 pt-3 sm:px-5">
              <h2 className="text-sm font-medium">Materiales / equipos solicitados</h2>
              <div className="flex items-center gap-3">
                <span className="text-xs tabular-nums text-muted-foreground">
                  {itemsLlenos === 1 ? '1 ítem registrado' : `${itemsLlenos} ítems registrados`}
                </span>
                <Button type="button" variant="outline" size="sm" onClick={() => setPegarOpen(true)}>
                  <ClipboardPaste />
                  Pegar desde Excel
                </Button>
              </div>
            </div>

            <div role="table" aria-label="Materiales y equipos solicitados" className="px-2 pb-2 sm:px-3">
              <div
                role="row"
                className="hidden grid-cols-[28px_minmax(0,2fr)_76px_132px_minmax(0,1.4fr)_64px] items-center gap-1.5 border-b border-border px-2 pb-1.5 pt-2 text-xs text-muted-foreground md:grid"
              >
                <span role="columnheader" className="text-right">#</span>
                <span role="columnheader">Descripción</span>
                <span role="columnheader">Cant.</span>
                <span role="columnheader">Unidad</span>
                <span role="columnheader">Observaciones</span>
                <span role="columnheader" className="sr-only">Acciones</span>
              </div>

              {lineas.map((linea, i) => (
                <ItemRow
                  key={linea.id}
                  index={i}
                  linea={linea}
                  errors={errors}
                  onChange={(patch) => updateLinea(linea.id, patch)}
                  onOpenSpec={() => setSpecLineaId(linea.id)}
                  onRemove={() => eliminarLinea(i)}
                  onKeyDown={(e, col) => handleCellKeyDown(e, i, col)}
                  onPasteDescripcion={(e) => handlePasteDescripcion(e, i)}
                />
              ))}

              <button
                type="button"
                onClick={() => agregarLinea()}
                className="mt-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:bg-muted hover:text-foreground"
              >
                <Plus className="size-4" />
                Agregar fila
                <span className="hidden text-xs text-muted-foreground/80 lg:inline">(Enter en la última celda agrega una nueva)</span>
              </button>
            </div>

            <div aria-live="polite" className="px-4 sm:px-5">
              {aviso && (
                <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-1.5 text-sm">
                  <span>{aviso.texto}</span>
                  {aviso.deshacer && (
                    <Button type="button" variant="ghost" size="xs" onClick={aviso.deshacer}>
                      Deshacer
                    </Button>
                  )}
                </div>
              )}
            </div>
          </section>


          <section className="rounded-xl border border-border bg-white p-4 sm:p-5">
            <label htmlFor="req-nota" className={labelCn}>
              Observaciones generales / Justificación <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <Textarea
              id="req-nota"
              rows={3}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Contexto o justificación para quien aprueba"
              className="min-h-20"
            />
          </section>
        </div>

        <aside aria-labelledby="req-resumen" className="rounded-xl border border-border bg-white p-4 lg:sticky lg:top-4">
          <h2 id="req-resumen" className="mb-3 text-sm font-medium">Resumen</h2>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Ítems</dt>
            <dd className="text-right font-medium tabular-nums">{itemsLlenos}</dd>
            <dt className="text-muted-foreground">Tipo</dt>
            <dd className="text-right font-medium">{tipo ? TIPO_LABELS[tipo] : '—'}</dd>
            <dt className="text-muted-foreground">Prioridad</dt>
            <dd className="text-right font-medium">{PRIORIDAD_LABEL[prioridad]}</dd>
            <dt className="text-muted-foreground">Requerido para</dt>
            <dd className="text-right font-medium">{fechaEntregaRequerida ? formatFechaResumen(fechaEntregaRequerida) : '—'}</dd>
            <dt className="text-muted-foreground">Proyecto</dt>
            <dd className="truncate text-right font-medium" title={proyectoResumen}>{proyectoResumen || '—'}</dd>
          </dl>
          <p className="mt-4 text-xs text-muted-foreground">
            Al enviar, el requerimiento pasa a revisión. Un borrador puede guardarse sin fecha.
          </p>
        </aside>
      </div>

      {serverError && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      {/* Barra de acciones fija */}
      <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-white/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <p className="mr-auto text-xs text-muted-foreground" aria-live="polite">
          {errorCount > 0 ? (
            <span className="font-medium text-destructive">
              {errorCount === 1 ? 'Falta 1 dato por completar' : `Faltan ${errorCount} datos por completar`}
            </span>
          ) : (
            <>
              {itemsLlenos === 1 ? '1 ítem' : `${itemsLlenos} ítems`}
              {conAdjunto > 0 && ` · ${conAdjunto} con adjunto`}
            </>
          )}
        </p>
        <Link href="/solicitudes" className={buttonVariants({ variant: 'ghost' })}>
          Cancelar
        </Link>
        <Button type="button" variant="outline" disabled={loading !== null} onClick={(e) => handleSubmit(e, false)}>
          {loading === 'borrador' ? 'Guardando…' : 'Guardar borrador'}
        </Button>
        <Button type="button" disabled={loading !== null} className="min-w-40" onClick={(e) => handleSubmit(e, true)}>
          {loading === 'enviar' ? 'Enviando…' : 'Confirmar y enviar requerimiento'}
        </Button>
      </div>

      <EspecificacionModal
        open={specLinea !== null}
        onOpenChange={(o) => !o && setSpecLineaId(null)}
        initial={specLinea && (specLinea.observacion || specLinea.archivos.length) ? { descripcion: specLinea.observacion, archivos: specLinea.archivos } : null}
        onSave={(data) => {
          if (specLinea) updateLinea(specLinea.id, { observacion: data.descripcion, archivos: data.archivos })
          setSpecLineaId(null)
        }}
      />

      <PegarExcelModal
        open={pegarOpen}
        onOpenChange={setPegarOpen}
        onConfirm={(filas) => {
          insertarFilas(filas, null)
          setPegarOpen(false)
        }}
      />
    </form>
  )
}

interface ItemRowProps {
  index: number
  linea: LineaItem
  errors: Record<string, string>
  onChange: (patch: Partial<LineaItem>) => void
  onOpenSpec: () => void
  onRemove: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, col: number) => void
  onPasteDescripcion: (e: React.ClipboardEvent<HTMLInputElement>) => void
}

// Desde `md` la fila es una línea de la grilla (alineada con el encabezado); debajo de `md`
// los mismos campos se apilan como tarjeta para que no haya scroll horizontal en teléfono.
function ItemRow({ index, linea, errors, onChange, onOpenSpec, onRemove, onKeyDown, onPasteDescripcion }: ItemRowProps) {
  const n = index + 1
  const errDescripcion = errors[`${linea.id}:descripcion`]
  const errCantidad = errors[`${linea.id}:cantidad`]
  const errUnidad = errors[`${linea.id}:unidad`]
  const sinUnidad = linea.unidad === ''
  const adjuntos = linea.archivos.length

  return (
    <div
      role="row"
      className="group/row mt-2 grid grid-cols-[76px_minmax(0,1fr)] items-center gap-1.5 rounded-lg border border-border p-2 md:mt-0 md:grid-cols-[28px_minmax(0,2fr)_76px_132px_minmax(0,1.4fr)_64px] md:border-0 md:px-2 md:py-0.5 md:hover:bg-muted/50 md:focus-within:bg-muted/50"
    >
      <span role="cell" className="hidden text-right font-mono text-xs tabular-nums text-muted-foreground md:block">
        {n}
      </span>

      <div role="cell" className="col-span-2 md:col-span-1">
        <Input
          data-cell={`${index}-${COL_DESCRIPCION}`}
          value={linea.descripcion}
          onChange={(e) => onChange({ descripcion: e.target.value })}
          onKeyDown={(e) => onKeyDown(e, COL_DESCRIPCION)}
          onPaste={onPasteDescripcion}
          placeholder="Ej: Plancha melamina 18 mm blanco"
          aria-label={`Descripción del ítem ${n}`}
          aria-invalid={!!errDescripcion}
          title={errDescripcion}
          className={cellCn}
        />
      </div>

      <div role="cell">
        <Input
          data-cell={`${index}-${COL_CANTIDAD}`}
          inputMode="decimal"
          value={linea.cantidad}
          onChange={(e) => {
            const v = e.target.value.replace(',', '.')
            if (/^\d*\.?\d*$/.test(v)) onChange({ cantidad: v })
          }}
          onKeyDown={(e) => onKeyDown(e, COL_CANTIDAD)}
          placeholder="0"
          aria-label={`Cantidad del ítem ${n}`}
          aria-invalid={!!errCantidad}
          title={errCantidad}
          className={cn(cellCn, 'text-right font-mono tabular-nums md:text-right')}
        />
      </div>

      <div role="cell">
        <select
          data-cell={`${index}-${COL_UNIDAD}`}
          value={linea.unidad}
          onChange={(e) => onChange({ unidad: e.target.value as UnidadMedida })}
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

      <div role="cell" className="col-span-2 md:col-span-1">
        <Input
          data-cell={`${index}-${COL_OBSERVACION}`}
          value={linea.observacion}
          onChange={(e) => onChange({ observacion: e.target.value })}
          onKeyDown={(e) => onKeyDown(e, COL_OBSERVACION)}
          placeholder="Talla, marca, uso"
          aria-label={`Observaciones del ítem ${n}`}
          className={cellCn}
        />
      </div>

      <div role="cell" className="col-span-2 flex items-center justify-between md:col-span-1 md:justify-end">
        <span className="text-xs font-medium text-muted-foreground md:hidden">Ítem {n}</span>
        <div className="flex items-center gap-0.5 md:opacity-40 md:transition-opacity md:group-hover/row:opacity-100 md:group-focus-within/row:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onOpenSpec}
            aria-label={adjuntos > 0 ? `Adjuntos del ítem ${n}: ${adjuntos}` : `Adjuntar archivo al ítem ${n}`}
            className={cn(adjuntos > 0 && 'w-auto gap-0.5 px-1.5 text-primary')}
          >
            <Paperclip />
            {adjuntos > 0 && <span className="text-xs tabular-nums">{adjuntos}</span>}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            aria-label={`Eliminar ítem ${n}`}
            className="text-muted-foreground hover:bg-destructive/5 hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </div>
  )
}
