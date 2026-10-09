'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ClipboardPaste } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { ObservacionesCard } from '@/components/registro/ObservacionesCard'
import { ResumenCard } from '@/components/registro/ResumenCard'
import { BarraAcciones } from '@/components/registro/BarraAcciones'
import { PrioridadSegmentada } from '@/components/requerimientos/PrioridadSegmentada'
import { PRIORIDAD_LABEL } from '@/lib/prioridad'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSession } from '@/lib/auth/session'
import { cn } from '@/lib/utils'
import { hoyLimaISO } from '@/lib/date/fecha-lima'
import { tipoEfectivo, tiposCreablesPorRol } from '@/lib/requerimientos'
import type { FilaPegada } from '@/lib/requerimientos-paste'
import type { PrioridadRequerimiento, Proyecto, Role, TipoRequerimiento, UnidadMedida } from '@/types/api'
import { EspecificacionModal, type EspecificacionArchivo, type EspecificacionData } from './EspecificacionModal'
import { PegarExcelModal } from './PegarExcelModal'
import { LineasTable, COL_DESCRIPCION } from '@/components/registro/LineasTable'

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

const labelCn = 'mb-1.5 block text-[13px] font-medium'

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
              <h2 className="text-sm font-medium">Materiales / equipos</h2>
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

            <div className="px-2 pb-2 sm:px-3">
              <LineasTable
                etiqueta="Materiales y equipos solicitados"
                lineas={lineas.map((l) => ({ ...l, adjuntos: l.archivos.length }))}
                conObservacion
                getError={(i, campo) => errors[`${lineas[i].id}:${campo}`]}
                onChange={(i, patch) => updateLinea(lineas[i].id, patch)}
                onAgregar={() => agregarLinea()}
                onQuitar={eliminarLinea}
                onPegarFilas={(i, filas) => insertarFilas(filas, i)}
                onAbrirEspecificacion={(i) => setSpecLineaId(lineas[i].id)}
              />
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


          <ObservacionesCard value={nota} onChange={setNota} placeholder="Contexto o justificación para quien aprueba" />
        </div>

        <ResumenCard
          filas={[
            { label: 'Solicitante', value: session?.user?.name ?? '—', title: session?.user?.name ?? undefined },
            { label: 'Ítems', value: itemsLlenos },
            { label: 'Tipo', value: tipo ? TIPO_LABELS[tipo] : '—' },
            { label: 'Prioridad', value: PRIORIDAD_LABEL[prioridad] },
            { label: 'Requerido para', value: fechaEntregaRequerida ? formatFechaResumen(fechaEntregaRequerida) : '—' },
            { label: 'Proyecto', value: proyectoResumen || '—', title: proyectoResumen },
          ]}
        >
          <p className="mt-4 text-xs text-muted-foreground">
            Al enviar, el requerimiento pasa a revisión. Un borrador puede guardarse sin fecha.
          </p>
        </ResumenCard>
      </div>

      {serverError && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      {/* Barra de acciones fija */}
      <BarraAcciones
        hayErrores={errorCount > 0}
        mensaje={
          errorCount > 0 ? (
            errorCount === 1 ? 'Falta 1 dato por completar' : `Faltan ${errorCount} datos por completar`
          ) : (
            <>
              {itemsLlenos === 1 ? '1 ítem' : `${itemsLlenos} ítems`}
              {conAdjunto > 0 && ` · ${conAdjunto} con adjunto`}
            </>
          )
        }
      >
        <Link href="/solicitudes" className={buttonVariants({ variant: 'ghost' })}>
          Cancelar
        </Link>
        <Button type="button" variant="outline" disabled={loading !== null} onClick={(e) => handleSubmit(e, false)}>
          {loading === 'borrador' ? 'Guardando…' : 'Guardar borrador'}
        </Button>
        <Button type="button" disabled={loading !== null} className="min-w-40" onClick={(e) => handleSubmit(e, true)}>
          {loading === 'enviar' ? 'Enviando…' : 'Confirmar y enviar requerimiento'}
        </Button>
      </BarraAcciones>

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
