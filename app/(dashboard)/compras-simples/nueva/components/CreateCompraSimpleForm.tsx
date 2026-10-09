'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2, Building2, Upload, ClipboardPaste, Check, AlertCircle, ChevronDown, Landmark } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { SegmentedControl } from '@/components/registro/SegmentedControl'
import { RegistroSection } from '@/components/registro/RegistroSection'
import { ResumenCard } from '@/components/registro/ResumenCard'
import { BarraAcciones } from '@/components/registro/BarraAcciones'
import { ObservacionesCard } from '@/components/registro/ObservacionesCard'
import { hoyLimaISO } from '@/lib/date/fecha-lima'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSession } from '@/lib/auth/session'
import { cn } from '@/lib/utils'
import type { FilaPegada } from '@/lib/requerimientos-paste'
import { LineasTable, COL_DESCRIPCION } from '@/components/registro/LineasTable'
import { PegarExcelModal } from '@/app/(dashboard)/requerimientos/nuevo/components/PegarExcelModal'
import { tipoEfectivo, tiposCreablesPorRol } from '@/lib/requerimientos'
import type { DestinoPago, MetodoPagoTrabajador, Proyecto, UnidadMedida, Proveedor, Trabajador, TipoRequerimiento, User } from '@/types/api'

type MiTrabajador = Pick<Trabajador, 'id' | 'nombre' | 'banco' | 'numeroCuenta'>
type AprobadorInformal = Pick<User, 'id' | 'name' | 'role'>

interface ItemLinea {
  descripcion: string
  cantidad: string
  unidad: string
  precioUnitario: string
}

interface Grupo {
  proveedorId: string
  proveedorNombreLibre: string
  sinProveedor: boolean
  fechaEntrega: string
  items: ItemLinea[]
  destinoPago: DestinoPago
  pagoBanco: string
  pagoNumeroCuenta: string
  pagoRazonSocial: string
  pagoMetodo: MetodoPagoTrabajador
  pagoTrabajadorBanco: string
  pagoTrabajadorNumeroCuenta: string
  pagoTrabajadorNumero: string
  /** Cotización o proforma que respalda el monto (opcional). */
  cotizacion: File | null
  /** Solo interfaz: `false` cuando la empresa se plegó al completarse. */
  abierto?: boolean
}

interface Props {
  proyectos: Proyecto[]
  proveedores: Proveedor[]
}

const labelCn = 'mb-1.5 block text-[13px] font-medium'
const emptyItem = (): ItemLinea => ({ descripcion: '', cantidad: '', unidad: 'und', precioUnitario: '' })
const emptyGrupo = (): Grupo => ({
  proveedorId: '',
  proveedorNombreLibre: '',
  sinProveedor: false,
  fechaEntrega: '',
  items: [emptyItem()],
  destinoPago: 'empresa',
  pagoBanco: '',
  pagoNumeroCuenta: '',
  pagoRazonSocial: '',
  pagoMetodo: 'registrado',
  pagoTrabajadorBanco: '',
  pagoTrabajadorNumeroCuenta: '',
  pagoTrabajadorNumero: '',
  cotizacion: null,
  abierto: true,
})

const DRAFT_KEY = 'compras-simples-nueva-draft'

interface Draft {
  /** Los borradores anteriores guardaban el nombre; ahora se genera solo. */
  nombre?: string
  tipo: TipoRequerimiento | null
  esRendicion: boolean
  proyectoId: string
  nota: string
  grupos: Grupo[]
  aprobadoInformalPorId: string
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

const TIPO_LABELS: Record<TipoRequerimiento, string> = {
  civil: 'Compra Civil',
  electrico: 'Compra Eléctrica',
  seguridad: 'Compra SSOMA',
  administrativo: 'Compra Administrativa',
}

const MODOS: Array<{ value: 'pagar' | 'rendicion'; label: string; description: string }> = [
  { value: 'pagar', label: 'Por pagar', description: 'Se paga a la empresa o a mí, con los datos de abajo.' },
  { value: 'rendicion', label: 'Rendición', description: 'Ya pagué de mi bolsillo y pido reembolso con comprobante.' },
]

const DESTINOS: Array<{ value: DestinoPago; label: string }> = [
  { value: 'empresa', label: 'La empresa' },
  { value: 'trabajador', label: 'Mí (solicitante)' },
]

/** Mismo criterio que el requerimiento: «primer ítem (+N más)», máximo 80 caracteres. */
function nombreAutomatico(grupos: Grupo[]): string {
  const descripciones = grupos.flatMap((g) => g.items.map((it) => it.descripcion.trim()).filter(Boolean))
  if (descripciones.length === 0) return ''
  const nombre = descripciones.length > 1 ? `${descripciones[0]} (+${descripciones.length - 1} más)` : descripciones[0]
  return nombre.length > 80 ? `${nombre.slice(0, 79)}…` : nombre
}

function fmtMoney(v: number) {
  return `S/ ${v.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function CreateCompraSimpleForm({ proyectos, proveedores }: Props) {
  const { data: session } = useSession()
  const allowedTipos = tiposCreablesPorRol(session?.user?.role)

  const router = useRouter()
  const [tipoElegido, setTipoElegido] = useState<TipoRequerimiento | null>(null)
  const tipo = tipoEfectivo(tipoElegido, allowedTipos)
  const [esRendicion, setEsRendicion] = useState(false)
  const [comprobante, setComprobante] = useState<File | null>(null)
  const [fotoProducto, setFotoProducto] = useState<File | null>(null)
  const [proyectoId, setProyectoId] = useState('')
  const [nota, setNota] = useState('')
  const [grupos, setGrupos] = useState<Grupo[]>([emptyGrupo()])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [miTrabajador, setMiTrabajador] = useState<MiTrabajador | null>(null)
  const [miTrabajadorCargado, setMiTrabajadorCargado] = useState(false)
  const [aprobadores, setAprobadores] = useState<AprobadorInformal[]>([])
  const [aprobadoInformalPorId, setAprobadoInformalPorId] = useState('')
  const [draftRestored, setDraftRestored] = useState(false)
  const draftReady = useRef(false)

  useEffect(() => {
    const draft = loadDraft()
    if (draft) {
      setTipoElegido(draft.tipo)
      setEsRendicion(draft.esRendicion)
      setProyectoId(draft.proyectoId)
      setNota(draft.nota)
      setGrupos(draft.grupos.map((g) => ({ ...g, cotizacion: null })))
      setAprobadoInformalPorId(draft.aprobadoInformalPorId)
      setDraftRestored(true)
    }
    draftReady.current = true
  }, [])

  useEffect(() => {
    if (!draftReady.current) return
    const draft: Draft = { tipo, esRendicion, proyectoId, nota, grupos: grupos.map((g) => ({ ...g, cotizacion: null })), aprobadoInformalPorId }
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  }, [tipo, esRendicion, proyectoId, nota, grupos, aprobadoInformalPorId])

  function discardDraft() {
    clearDraft()
    setTipoElegido(null)
    setEsRendicion(false)
    setProyectoId('')
    setNota('')
    setGrupos([emptyGrupo()])
    setAprobadoInformalPorId('')
    setDraftRestored(false)
  }

  useEffect(() => {
    api.get<MiTrabajador | null>('/compras-simples/mi-trabajador')
      .then((t) => setMiTrabajador(t))
      .catch(() => setMiTrabajador(null))
      .finally(() => setMiTrabajadorCargado(true))
  }, [])

  useEffect(() => {
    api.get<AprobadorInformal[]>('/compras-simples/aprobadores-informales')
      .then((list) => setAprobadores(list))
      .catch(() => setAprobadores([]))
  }, [])

  function updateGrupo(gi: number, patch: Partial<Grupo>) {
    setGrupos((prev) => prev.map((g, i) => (i === gi ? { ...g, ...patch } : g)))
  }

  function updateItem(gi: number, ii: number, field: keyof ItemLinea, value: string) {
    setGrupos((prev) =>
      prev.map((g, i) =>
        i === gi
          ? { ...g, items: g.items.map((it, idx) => (idx === ii ? { ...it, [field]: value } : it)) }
          : g,
      ),
    )
    setErrors((prev) => {
      const next = { ...prev }
      delete next[`g${gi}_i${ii}_${field}`]
      return next
    })
  }

  function grupoTotal(g: Grupo) {
    return g.items.reduce((s, it) => s + (parseFloat(it.cantidad) || 0) * (parseFloat(it.precioUnitario) || 0), 0)
  }

  /** Errores de una empresa; vacío cuando está completa. */
  function erroresGrupo(g: Grupo, gi: number) {
    const next: Record<string, string> = {}
      if (!g.sinProveedor && !g.proveedorId) next[`g${gi}_proveedor`] = 'Selecciona un proveedor o marca "sin proveedor registrado"'
      if (g.sinProveedor && !g.proveedorNombreLibre.trim()) next[`g${gi}_proveedor`] = 'Ingresa la razón social'

      if (!esRendicion && g.destinoPago === 'empresa') {
        if (!g.pagoBanco.trim()) next[`g${gi}_pagoBanco`] = 'Ingresa el banco'
        if (!g.pagoNumeroCuenta.trim()) next[`g${gi}_pagoNumeroCuenta`] = 'Ingresa el número de cuenta'
        if (!g.pagoRazonSocial.trim()) next[`g${gi}_pagoRazonSocial`] = 'Ingresa la razón social de la cuenta'
      } else {
        if (g.pagoMetodo === 'registrado' && (!miTrabajador?.banco || !miTrabajador?.numeroCuenta)) {
          next[`g${gi}_pagoMetodo`] = 'No tienes banco/cuenta registrados, selecciona otro método'
        }
        if (g.pagoMetodo === 'transferencia') {
          if (!g.pagoTrabajadorBanco.trim()) next[`g${gi}_pagoTrabajadorBanco`] = 'Ingresa el banco'
          if (!g.pagoTrabajadorNumeroCuenta.trim()) next[`g${gi}_pagoTrabajadorNumeroCuenta`] = 'Ingresa el número de cuenta'
        }
        if ((g.pagoMetodo === 'yape' || g.pagoMetodo === 'plin') && !g.pagoTrabajadorNumero.trim()) {
          next[`g${gi}_pagoTrabajadorNumero`] = 'Ingresa el número de celular'
        }
      }

      g.items.forEach((it, ii) => {
        if (!it.descripcion.trim()) next[`g${gi}_i${ii}_descripcion`] = 'Ingresa una descripción'
        const qty = parseFloat(it.cantidad)
        if (!it.cantidad || isNaN(qty) || qty <= 0) next[`g${gi}_i${ii}_cantidad`] = 'Cantidad inválida'
        if (!it.unidad) next[`g${gi}_i${ii}_unidad`] = 'Elige la unidad'
        const price = parseFloat(it.precioUnitario)
        if (!it.precioUnitario || isNaN(price) || price < 0) next[`g${gi}_i${ii}_precioUnitario`] = 'Precio inválido'
      })
    return next
  }

  function validate() {
    const next: Record<string, string> = {}
    if (!proyectoId) next.proyectoId = 'Selecciona un proyecto'
    if (!tipo) next.tipo = 'Tu rol no puede crear este tipo de compra'
    grupos.forEach((g, gi) => Object.assign(next, erroresGrupo(g, gi)))
    if (esRendicion && !comprobante) next.comprobante = 'Adjunta el comprobante (boleta/factura) de la compra'
    if (esRendicion && !aprobadoInformalPorId) next.aprobadoInformalPorId = 'Selecciona quién aprobó la compra'
    setErrors(next)
    if (Object.keys(next).length > 0) {
      // Las empresas plegadas con errores se abren para que el foco llegue al campo.
      setGrupos((prev) => prev.map((g, gi) => (Object.keys(next).some((k) => k.startsWith(`g${gi}_`)) ? { ...g, abierto: true } : g)))
      setTimeout(() => {
        const first = document.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid="true"]')
        first?.scrollIntoView({ block: 'center', behavior: 'smooth' })
        first?.focus({ preventScroll: true })
      }, 60)
    }
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError(null)

    let result: { id: string; grupos: { id: string }[] } | null = null
    try {
      result = await api.post<{ id: string; grupos: { id: string }[] }>('/compras-simples', {
        nombre: nombreAutomatico(grupos),
        tipo,
        esRendicion,
        aprobadoInformalPorId: esRendicion ? aprobadoInformalPorId : undefined,
        proyectoId,
        nota: nota.trim() || undefined,
        grupos: grupos.map((g) => ({
          proveedorId: g.sinProveedor ? undefined : g.proveedorId,
          proveedorNombreLibre: g.sinProveedor ? g.proveedorNombreLibre.trim() : undefined,
          fechaEntrega: g.fechaEntrega || undefined,
          destinoPago: esRendicion ? 'trabajador' : g.destinoPago,
          pagoBanco: !esRendicion && g.destinoPago === 'empresa' ? g.pagoBanco.trim() : undefined,
          pagoNumeroCuenta: !esRendicion && g.destinoPago === 'empresa' ? g.pagoNumeroCuenta.trim() : undefined,
          pagoRazonSocial: !esRendicion && g.destinoPago === 'empresa' ? g.pagoRazonSocial.trim() : undefined,
          pagoMetodo: esRendicion || g.destinoPago === 'trabajador' ? g.pagoMetodo : undefined,
          pagoTrabajadorBanco: (esRendicion || g.destinoPago === 'trabajador') && g.pagoMetodo === 'transferencia' ? g.pagoTrabajadorBanco.trim() : undefined,
          pagoTrabajadorNumeroCuenta: (esRendicion || g.destinoPago === 'trabajador') && g.pagoMetodo === 'transferencia' ? g.pagoTrabajadorNumeroCuenta.trim() : undefined,
          pagoTrabajadorNumero: (esRendicion || g.destinoPago === 'trabajador') && (g.pagoMetodo === 'yape' || g.pagoMetodo === 'plin') ? g.pagoTrabajadorNumero.trim() : undefined,
          items: g.items.map((it) => ({
            descripcion: it.descripcion.trim(),
            cantidad: parseFloat(it.cantidad),
            unidad: it.unidad,
            precioUnitario: parseFloat(it.precioUnitario),
          })),
        })),
      })

      // Los adjuntos se suben ya con la compra creada; si alguno falla se avisa en el detalle.
      const subidas: Array<{ grupoId: string; archivo: File; tipo: 'comprobante' | 'foto_producto' | 'cotizacion' }> = []
      if (esRendicion && comprobante) {
        const grupoId = result.grupos[0]?.id
        if (grupoId) {
          subidas.push({ grupoId, archivo: comprobante, tipo: 'comprobante' })
          if (fotoProducto) subidas.push({ grupoId, archivo: fotoProducto, tipo: 'foto_producto' })
        }
      }
      if (!esRendicion) {
        grupos.forEach((g, gi) => {
          const grupoId = result?.grupos[gi]?.id
          if (grupoId && g.cotizacion) subidas.push({ grupoId, archivo: g.cotizacion, tipo: 'cotizacion' })
        })
      }
      try {
        for (const { grupoId, archivo, tipo: tipoArchivo } of subidas) {
          const form = new FormData()
          form.append('archivo', archivo)
          form.append('tipo', tipoArchivo)
          await api.upload(`/compras-simples/grupos/${grupoId}/archivos`, form)
        }
      } catch {
        clearDraft()
        router.push(`/compras-simples/${result.id}?adjuntoError=1`)
        router.refresh()
        return
      }

      clearDraft()
      router.push(`/compras-simples/${result.id}`)
      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al crear la compra simple')
    } finally {
      setLoading(false)
    }
  }

  const totalGeneral = grupos.reduce((s, g) => s + grupoTotal(g), 0)
  const itemsCount = grupos.reduce((s, g) => s + g.items.length, 0)
  const errorCount = Object.keys(errors).length
  const proyectoSel = proyectos.find((p) => p.id === proyectoId)
  const proyectoResumen = proyectoSel ? `${proyectoSel.codigo ? `${proyectoSel.codigo} · ` : ''}${proyectoSel.nombre}` : ''
  const nombreAuto = nombreAutomatico(grupos)
  const modo = esRendicion ? 'rendicion' : 'pagar'

  function cambiarModo(next: 'pagar' | 'rendicion') {
    const checked = next === 'rendicion'
    setEsRendicion(checked)
    if (checked) {
      setGrupos((p) => {
        const first = p[0] ?? emptyGrupo()
        return [{ ...first, destinoPago: 'trabajador' }]
      })
    }
    setErrors((p) => { const n = { ...p }; delete n.comprobante; delete n.aprobadoInformalPorId; return n })
  }

  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit}>
      {draftRestored && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-amber-700">
          <p>Se restauró un borrador que tenías sin enviar. Los archivos adjuntos deben seleccionarse de nuevo.</p>
          <button
            type="button"
            onClick={discardDraft}
            className="shrink-0 text-xs font-medium underline underline-offset-2 hover:text-amber-800"
          >
            Descartar
          </button>
        </div>
      )}

      <RegistroSection id="cs-general" title="Información general">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-3">
            <label htmlFor="cs-solicitante" className={labelCn}>Solicitante</label>
            <Input id="cs-solicitante" readOnly value={session?.user?.name ?? ''} className="bg-muted/50 text-muted-foreground" />
          </div>

          <div className="sm:col-span-2 lg:col-span-5">
            <label htmlFor="cs-proyecto" className={labelCn}>
              Proyecto / Centro de costos <span className="text-destructive">*</span>
            </label>
            <Select value={proyectoId} onValueChange={(v) => { setProyectoId(v ?? ''); setErrors((p) => { const n = { ...p }; delete n.proyectoId; return n }) }}>
              <SelectTrigger
                id="cs-proyecto"
                className={cn('w-full', errors.proyectoId && 'border-destructive')}
                aria-invalid={!!errors.proyectoId}
                aria-describedby={errors.proyectoId ? 'cs-proyecto-error' : undefined}
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
            {errors.proyectoId && <p id="cs-proyecto-error" className="mt-1 text-xs text-destructive">{errors.proyectoId}</p>}
          </div>

          <div className="lg:col-span-4">
            <label htmlFor="cs-tipo" className={labelCn}>
              Tipo <span className="text-destructive">*</span>
            </label>
            {allowedTipos.length <= 1 ? (
              // El rol solo puede crear un tipo — se muestra fijo
              <div
                id="cs-tipo"
                className="flex h-8 items-center rounded-lg border border-border bg-muted/50 px-2.5 text-sm text-muted-foreground"
              >
                {tipo ? TIPO_LABELS[tipo] : '—'}
              </div>
            ) : (
              <Select value={tipo} onValueChange={(v) => setTipoElegido(v as TipoRequerimiento)}>
                <SelectTrigger id="cs-tipo" className="w-full" aria-invalid={!!errors.tipo}>
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

          <div className="sm:col-span-2 lg:col-span-12">
            <span id="cs-modo-label" className={labelCn}>¿Cómo se paga esta compra?</span>
            <SegmentedControl
              value={modo}
              onChange={cambiarModo}
              options={MODOS}
              labelledBy="cs-modo-label"
            />
          </div>
        </div>
      </RegistroSection>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="space-y-4">
          <RegistroSection
            id="cs-materiales"
            title="Materiales / equipos"
            actions={
              <div className="flex items-center gap-3">
                <span className="text-xs tabular-nums text-muted-foreground">
                  {grupos.length === 1 ? '1 empresa' : `${grupos.length} empresas`}
                </span>
                {!esRendicion && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setGrupos((p) => [...p.map((g, i) => (Object.keys(erroresGrupo(g, i)).length === 0 ? { ...g, abierto: false } : g)), emptyGrupo()])}>
                    <Plus />
                    Agregar empresa
                  </Button>
                )}
              </div>
            }
          >
            {esRendicion && (
              <p className="mb-3 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                Una rendición se respalda con un solo comprobante, por eso admite una empresa.
              </p>
            )}
            <div className="space-y-4">
              {grupos.map((g, gi) => (
                <GrupoCard
                  key={gi}
                  grupo={g}
                  index={gi}
                  proveedores={proveedores}
                  errors={errors}
                  canRemove={grupos.length > 1 && !esRendicion}
                  completo={Object.keys(erroresGrupo(g, gi)).length === 0}
                  conErrores={Object.keys(errors).some((k) => k.startsWith(`g${gi}_`))}
                  abierto={g.abierto !== false}
                  onToggle={() => updateGrupo(gi, { abierto: g.abierto === false })}
                  esRendicion={esRendicion}
                  total={grupoTotal(g)}
                  solicitanteNombre={session?.user?.name}
                  miTrabajador={miTrabajador}
                  miTrabajadorCargado={miTrabajadorCargado}
                  onChange={(patch) => updateGrupo(gi, patch)}
                  onChangeItem={(ii, field, value) => updateItem(gi, ii, field, value)}
                  onRemoveItem={(ii) => updateGrupo(gi, { items: g.items.filter((_, idx) => idx !== ii) })}
                  onSetItems={(items) => updateGrupo(gi, { items })}
                  onRemoveGrupo={() => setGrupos((p) => p.filter((_, idx) => idx !== gi))}
                />
              ))}
            </div>
          </RegistroSection>

          {esRendicion && (
            <RegistroSection id="cs-respaldo" title="Respaldo del gasto">
              <div className="grid gap-4 sm:grid-cols-2">
                <FileField
                  label="Comprobante (boleta/factura)"
                  required
                  file={comprobante}
                  onChange={(f) => { setComprobante(f); setErrors((p) => { const n = { ...p }; delete n.comprobante; return n }) }}
                  error={errors.comprobante}
                />
                <FileField
                  label="Foto de los productos (opcional)"
                  file={fotoProducto}
                  onChange={setFotoProducto}
                />
                <div className="sm:col-span-2">
                  <label htmlFor="cs-aprobador" className={labelCn}>
                    ¿Quién aprobó la compra? <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={aprobadoInformalPorId}
                    onValueChange={(v) => {
                      setAprobadoInformalPorId(v ?? '')
                      setErrors((p) => { const n = { ...p }; delete n.aprobadoInformalPorId; return n })
                    }}
                  >
                    <SelectTrigger
                      id="cs-aprobador"
                      className={cn('w-full', errors.aprobadoInformalPorId && 'border-destructive')}
                      aria-invalid={!!errors.aprobadoInformalPorId}
                    >
                      <SelectValue>
                        {(value: string | null) => aprobadores.find((a) => a.id === value)?.name ?? 'Selecciona un gerente o administrador…'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {aprobadores.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Sirve como respaldo del gasto; gerencia igual deberá aprobarlo en el sistema.
                  </p>
                  {errors.aprobadoInformalPorId && <p className="mt-1 text-xs text-destructive">{errors.aprobadoInformalPorId}</p>}
                </div>
              </div>
            </RegistroSection>
          )}

          <ObservacionesCard value={nota} onChange={setNota} placeholder="Contexto de la compra, para quien la revisa" />
        </div>

        <ResumenCard
          filas={[
            { label: 'Solicitante', value: session?.user?.name ?? '—', title: session?.user?.name ?? undefined },
            { label: 'Empresas', value: grupos.length },
            { label: 'Ítems', value: itemsCount },
            { label: 'Tipo', value: tipo ? TIPO_LABELS[tipo] : '—' },
            { label: 'Proyecto', value: proyectoResumen || '—', title: proyectoResumen },
          ]}
        >
          <ul className="mt-3 space-y-2 text-sm">
            {grupos.map((g, gi) => {
              const nombreEmpresa = g.sinProveedor ? g.proveedorNombreLibre : proveedores.find((p) => p.id === g.proveedorId)?.razonSocial
              return (
                <li key={gi} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2">
                  <span className="truncate">Empresa {gi + 1}{nombreEmpresa ? ` · ${nombreEmpresa}` : ''}</span>
                  <span className="font-medium tabular-nums">{fmtMoney(grupoTotal(g))}</span>
                  <span className="col-span-2 text-xs text-muted-foreground">
                    {esRendicion || g.destinoPago === 'trabajador' ? 'Se deposita a ti (solicitante)' : 'Se deposita a la empresa'}
                  </span>
                </li>
              )
            })}
          </ul>
          <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-xl font-semibold tabular-nums">{fmtMoney(totalGeneral)}</span>
          </div>
          <div className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            Se registrará como
            <span className="block truncate text-sm font-medium text-foreground" title={nombreAuto}>{nombreAuto || '—'}</span>
          </div>
        </ResumenCard>
      </div>

      {serverError && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <BarraAcciones
        hayErrores={errorCount > 0}
        mensaje={
          errorCount > 0
            ? errorCount === 1 ? 'Falta 1 dato por completar' : `Faltan ${errorCount} datos por completar`
            : `${grupos.length === 1 ? '1 empresa' : `${grupos.length} empresas`} · ${itemsCount === 1 ? '1 ítem' : `${itemsCount} ítems`}`
        }
        extra={<span className="text-sm font-semibold tabular-nums lg:hidden">{fmtMoney(totalGeneral)}</span>}
      >
        <Link href="/compras-simples" className={buttonVariants({ variant: 'ghost' })}>
          Cancelar
        </Link>
        <Button type="submit" disabled={loading} className="min-w-40">
          {loading ? 'Registrando…' : 'Confirmar y registrar compra'}
        </Button>
      </BarraAcciones>
    </form>
  )
}

interface GrupoCardProps {
  grupo: Grupo
  index: number
  proveedores: Proveedor[]
  errors: Record<string, string>
  canRemove: boolean
  completo: boolean
  conErrores: boolean
  abierto: boolean
  onToggle: () => void
  esRendicion: boolean
  total: number
  solicitanteNombre?: string
  miTrabajador: MiTrabajador | null
  miTrabajadorCargado: boolean
  onChange: (patch: Partial<Grupo>) => void
  onChangeItem: (ii: number, field: keyof ItemLinea, value: string) => void
  onRemoveItem: (ii: number) => void
  onSetItems: (items: ItemLinea[]) => void
  onRemoveGrupo: () => void
}

function FileField({
  label, file, onChange, required, error,
}: { label: string; file: File | null; onChange: (f: File | null) => void; required?: boolean; error?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const fid = useId()
  return (
    <div>
      <span id={`${fid}-label`} className={labelCn}>
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        id={fid}
        aria-labelledby={`${fid}-label ${fid}`}
        data-invalid={error ? 'true' : undefined}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex h-9 w-full items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground hover:text-foreground transition-colors duration-[120ms]',
          error && 'border-destructive',
        )}
      >
        <Upload className="size-3.5 shrink-0" />
        <span className="truncate">{file ? file.name : 'Seleccionar archivo…'}</span>
      </button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}

const METODO_TRABAJADOR_LABELS: Record<MetodoPagoTrabajador, string> = {
  registrado: 'Usar banco/cuenta ya registrados',
  transferencia: 'Transferencia a otra cuenta',
  yape: 'Yape',
  plin: 'Plin',
}

function GrupoCard({
  grupo, index, proveedores, errors, canRemove, completo, conErrores, abierto, onToggle, esRendicion, total, solicitanteNombre, miTrabajador, miTrabajadorCargado,
  onChange, onChangeItem, onRemoveItem, onSetItems, onRemoveGrupo,
}: GrupoCardProps) {
  const proveedorError = errors[`g${index}_proveedor`]
  const nombreEmpresaTxt = (grupo.sinProveedor ? grupo.proveedorNombreLibre : proveedores.find((p) => p.id === grupo.proveedorId)?.razonSocial)
  const proveedorSel = proveedores.find((p) => p.id === grupo.proveedorId)
  const [otraCuenta, setOtraCuenta] = useState(false)
  const cuentaRegistrada = !grupo.sinProveedor && !!grupo.pagoBanco.trim() && !!grupo.pagoNumeroCuenta.trim() && !!grupo.pagoRazonSocial.trim()
  const [pegarOpen, setPegarOpen] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const pendingFocus = useRef<number | null>(null)

  // Mueve el foco a la descripción de la fila pedida una vez que React la pintó.
  useEffect(() => {
    if (pendingFocus.current === null) return
    const row = pendingFocus.current
    pendingFocus.current = null
    document.querySelector<HTMLElement>(`[data-cell="g${index}-${row}-${COL_DESCRIPCION}"]`)?.focus()
  }, [grupo.items, index])

  function agregarFila() {
    pendingFocus.current = grupo.items.length
    onSetItems([...grupo.items, emptyItem()])
  }

  // Reemplaza la fila vacía donde estaba el cursor o inserta tras ella.
  function insertarFilas(at: number, filas: FilaPegada[]) {
    const validas = filas.filter((f) => f.descripcion)
    if (validas.length === 0) return
    const nuevas: ItemLinea[] = validas.map((f) => ({
      descripcion: f.descripcion,
      cantidad: f.cantidad,
      unidad: f.unidad ?? '',
      precioUnitario: f.precio,
    }))
    const actual = grupo.items[at]
    const reemplaza = !!actual && !actual.descripcion.trim() && !actual.cantidad && !actual.precioUnitario
    const next = [...grupo.items]
    next.splice(reemplaza ? at : at + 1, reemplaza ? 1 : 0, ...nuevas)
    pendingFocus.current = (reemplaza ? at : at + 1) + nuevas.length - 1
    onSetItems(next)
    const sinUnidad = nuevas.filter((l) => l.unidad === '').length
    const sinPrecio = nuevas.filter((l) => !l.precioUnitario).length
    setAviso(
      `${nuevas.length === 1 ? '1 fila agregada' : `${nuevas.length} filas agregadas`}` +
        (sinUnidad ? ` · ${sinUnidad} sin unidad, elígela en la tabla` : '') +
        (sinPrecio ? ` · ${sinPrecio} sin precio` : ''),
    )
  }

  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center gap-1 pr-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={abierto}
          aria-controls={`cs-g${index}-cuerpo`}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-4 py-3 text-left transition-colors duration-[120ms] hover:bg-muted/40"
        >
          <Building2 className="size-4 shrink-0 text-muted-foreground" />
          <span className="shrink-0 text-sm font-medium">Empresa {index + 1}</span>
          <span className="min-w-0 truncate text-sm text-muted-foreground">
            {nombreEmpresaTxt || 'Sin proveedor elegido'} · {grupo.items.length === 1 ? '1 ítem' : `${grupo.items.length} ítems`}
          </span>
          {completo ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-700">
              <Check className="size-3.5" aria-hidden /> Completa
            </span>
          ) : conErrores ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-destructive">
              <AlertCircle className="size-3.5" aria-hidden /> Faltan datos
            </span>
          ) : null}
          <span className="ml-auto shrink-0 text-sm font-medium tabular-nums">{fmtMoney(total)}</span>
          <ChevronDown className={cn('size-4 shrink-0 text-muted-foreground transition-transform duration-200', abierto && 'rotate-180')} aria-hidden />
        </button>
        <button
          type="button"
          onClick={onRemoveGrupo}
          disabled={!canRemove}
          aria-label={`Quitar empresa ${index + 1}`}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors duration-[120ms] disabled:pointer-events-none disabled:opacity-30"
        >
          <Trash2 className="size-3.75" />
        </button>
      </div>

    <div id={`cs-g${index}-cuerpo`} hidden={!abierto} className="space-y-3 border-t border-border p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={grupo.sinProveedor ? 'sm:col-span-2' : ''}>
          <label htmlFor={`cs-g${index}-proveedor`} className={labelCn}>
            {grupo.sinProveedor ? 'Razón social' : 'Proveedor'} <span className="text-destructive">*</span>
          </label>
          {grupo.sinProveedor ? (
            <Input
              id={`cs-g${index}-proveedor`}
              aria-invalid={!!proveedorError}
              value={grupo.proveedorNombreLibre}
              onChange={(e) => onChange({ proveedorNombreLibre: e.target.value })}
              placeholder="Ej: Ferretería El Constructor"
              className={cn(proveedorError && 'border-destructive')}
            />
          ) : (
            <Select
              value={grupo.proveedorId}
              onValueChange={(v) => {
                const proveedor = proveedores.find((p) => p.id === v)
                setOtraCuenta(false)
                onChange({
                  proveedorId: v ?? '',
                  pagoBanco: proveedor?.banco ?? '',
                  pagoNumeroCuenta: proveedor?.numeroCuenta ?? '',
                  pagoRazonSocial: proveedor?.razonSocial ?? '',
                })
              }}
            >
              <SelectTrigger id={`cs-g${index}-proveedor`} aria-invalid={!!proveedorError} className={cn('w-full', proveedorError && 'border-destructive')}>
                <SelectValue>
                  {(value: string | null) => proveedores.find((p) => p.id === value)?.razonSocial ?? 'Selecciona un proveedor…'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {proveedores.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.razonSocial}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {proveedorError && <p className="mt-1 text-xs text-destructive">{proveedorError}</p>}
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={grupo.sinProveedor}
              onChange={(e) => onChange({ sinProveedor: e.target.checked, proveedorId: '', proveedorNombreLibre: '' })}
              className="size-4 rounded border-border accent-primary"
            />
            <span className="text-sm">Sin proveedor registrado (sin RUC)</span>
          </label>
        </div>

        <div>
          <span id={`cs-g${index}-fecha-label`} className={labelCn}>Fecha solicitada de pago</span>
          <DatePicker
            value={grupo.fechaEntrega}
            onValueChange={(v) => onChange({ fechaEntrega: v })}
            min={hoyLimaISO()}
            placeholder="Seleccionar fecha"
          />
          <p className="mt-1 text-xs text-muted-foreground">Para cuándo se necesita pagar a esta empresa</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
        <p className="text-sm font-medium">Condiciones de pago</p>

        {esRendicion ? (
          <p className="text-xs text-muted-foreground">
            Rendición: el pago se depositará únicamente al solicitante, no a la empresa.
          </p>
        ) : (
          <div>
            <span id={`cs-g${index}-destino`} className={labelCn}>Depositar a</span>
            <SegmentedControl
              value={grupo.destinoPago}
              onChange={(v) => onChange({ destinoPago: v })}
              options={DESTINOS}
              labelledBy={`cs-g${index}-destino`}
              className="max-w-md"
            />
          </div>
        )}

        {!esRendicion && grupo.destinoPago === 'empresa' && cuentaRegistrada && !otraCuenta ? (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-600/30 bg-emerald-50 px-3 py-2">
            <Landmark className="size-4 shrink-0 text-emerald-700" aria-hidden />
            <div className="min-w-0 text-sm">
              <p className="font-medium">
                {grupo.pagoBanco} · <span className="font-mono tabular-nums">{grupo.pagoNumeroCuenta}</span>
              </p>
              <p className="truncate text-xs text-muted-foreground">{grupo.pagoRazonSocial} · cuenta registrada del proveedor</p>
            </div>
            <button
              type="button"
              onClick={() => setOtraCuenta(true)}
              className="ml-auto text-sm text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Usar otra cuenta
            </button>
            <p className="basis-full text-xs text-muted-foreground">Confirma que es la cuenta correcta: algunos proveedores manejan varias.</p>
          </div>
        ) : !esRendicion && grupo.destinoPago === 'empresa' ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor={`cs-g${index}-pagoBanco`} className={labelCn}>Banco <span className="text-destructive">*</span></label>
              <Input
                id={`cs-g${index}-pagoBanco`}
                aria-invalid={!!errors[`g${index}_pagoBanco`]}
                value={grupo.pagoBanco}
                onChange={(e) => onChange({ pagoBanco: e.target.value })}
                placeholder="Ej: BCP"
                className={cn(errors[`g${index}_pagoBanco`] && 'border-destructive')}
              />
              {errors[`g${index}_pagoBanco`] && <p className="mt-1 text-xs text-destructive">{errors[`g${index}_pagoBanco`]}</p>}
            </div>
            <div>
              <label htmlFor={`cs-g${index}-pagoNumeroCuenta`} className={labelCn}>N° de cuenta <span className="text-destructive">*</span></label>
              <Input
                id={`cs-g${index}-pagoNumeroCuenta`}
                aria-invalid={!!errors[`g${index}_pagoNumeroCuenta`]}
                value={grupo.pagoNumeroCuenta}
                onChange={(e) => onChange({ pagoNumeroCuenta: e.target.value })}
                className={cn(errors[`g${index}_pagoNumeroCuenta`] && 'border-destructive')}
              />
              {errors[`g${index}_pagoNumeroCuenta`] && <p className="mt-1 text-xs text-destructive">{errors[`g${index}_pagoNumeroCuenta`]}</p>}
            </div>
            <div>
              <label htmlFor={`cs-g${index}-pagoRazonSocial`} className={labelCn}>Razón social de la cuenta <span className="text-destructive">*</span></label>
              <Input
                id={`cs-g${index}-pagoRazonSocial`}
                aria-invalid={!!errors[`g${index}_pagoRazonSocial`]}
                value={grupo.pagoRazonSocial}
                onChange={(e) => onChange({ pagoRazonSocial: e.target.value })}
                className={cn(errors[`g${index}_pagoRazonSocial`] && 'border-destructive')}
              />
              {errors[`g${index}_pagoRazonSocial`] && <p className="mt-1 text-xs text-destructive">{errors[`g${index}_pagoRazonSocial`]}</p>}
            </div>
            <p className="sm:col-span-3 text-xs text-muted-foreground">
              Confirma estos datos aunque el proveedor ya los tenga registrados — algunos manejan varias cuentas.
              {proveedorSel?.banco && proveedorSel.numeroCuenta && (
                <>
                  {' '}
                  <button
                    type="button"
                    onClick={() => {
                      onChange({
                        pagoBanco: proveedorSel.banco ?? '',
                        pagoNumeroCuenta: proveedorSel.numeroCuenta ?? '',
                        pagoRazonSocial: proveedorSel.razonSocial ?? '',
                      })
                      setOtraCuenta(false)
                    }}
                    className="text-primary underline underline-offset-2 hover:text-primary/80"
                  >
                    Volver a la cuenta registrada del proveedor
                  </button>
                </>
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Se depositará al solicitante{solicitanteNombre ? <>: <span className="font-medium text-foreground">{solicitanteNombre}</span></> : '.'}
            </p>
            <div>
              <label className={labelCn}>Método</label>
              <Select value={grupo.pagoMetodo} onValueChange={(v) => onChange({ pagoMetodo: (v as MetodoPagoTrabajador) ?? 'registrado' })}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value: MetodoPagoTrabajador | null) => (value ? METODO_TRABAJADOR_LABELS[value] : '')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(METODO_TRABAJADOR_LABELS) as MetodoPagoTrabajador[]).map((m) => (
                    <SelectItem key={m} value={m}>{METODO_TRABAJADOR_LABELS[m]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {grupo.pagoMetodo === 'registrado' && (
              <div className="space-y-2">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={labelCn}>Banco registrado</label>
                    <Input value={miTrabajador?.banco ?? ''} disabled placeholder="—" />
                  </div>
                  <div>
                    <label className={labelCn}>N° de cuenta registrado</label>
                    <Input value={miTrabajador?.numeroCuenta ?? ''} disabled placeholder="—" />
                  </div>
                </div>
                {miTrabajadorCargado && (!miTrabajador?.banco || !miTrabajador?.numeroCuenta) && (
                  <p className="text-xs text-destructive">
                    No tienes banco/cuenta registrados en tu ficha de trabajador. Selecciona otro método.
                  </p>
                )}
                {errors[`g${index}_pagoMetodo`] && <p className="text-xs text-destructive">{errors[`g${index}_pagoMetodo`]}</p>}
              </div>
            )}

            {grupo.pagoMetodo === 'transferencia' && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelCn}>Banco <span className="text-destructive">*</span></label>
                  <Input
                    value={grupo.pagoTrabajadorBanco}
                    onChange={(e) => onChange({ pagoTrabajadorBanco: e.target.value })}
                    className={cn(errors[`g${index}_pagoTrabajadorBanco`] && 'border-destructive')}
                  />
                  {errors[`g${index}_pagoTrabajadorBanco`] && <p className="mt-1 text-xs text-destructive">{errors[`g${index}_pagoTrabajadorBanco`]}</p>}
                </div>
                <div>
                  <label className={labelCn}>N° de cuenta <span className="text-destructive">*</span></label>
                  <Input
                    value={grupo.pagoTrabajadorNumeroCuenta}
                    onChange={(e) => onChange({ pagoTrabajadorNumeroCuenta: e.target.value })}
                    className={cn(errors[`g${index}_pagoTrabajadorNumeroCuenta`] && 'border-destructive')}
                  />
                  {errors[`g${index}_pagoTrabajadorNumeroCuenta`] && <p className="mt-1 text-xs text-destructive">{errors[`g${index}_pagoTrabajadorNumeroCuenta`]}</p>}
                </div>
              </div>
            )}

            {(grupo.pagoMetodo === 'yape' || grupo.pagoMetodo === 'plin') && (
              <div>
                <label className={labelCn}>Número de celular <span className="text-destructive">*</span></label>
                <Input
                  value={grupo.pagoTrabajadorNumero}
                  onChange={(e) => onChange({ pagoTrabajadorNumero: e.target.value })}
                  placeholder="987654321"
                  className={cn(errors[`g${index}_pagoTrabajadorNumero`] && 'border-destructive')}
                />
                {errors[`g${index}_pagoTrabajadorNumero`] && <p className="mt-1 text-xs text-destructive">{errors[`g${index}_pagoTrabajadorNumero`]}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs tabular-nums text-muted-foreground">
            {grupo.items.length === 1 ? '1 ítem' : `${grupo.items.length} ítems`}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => setPegarOpen(true)}>
            <ClipboardPaste />
            Pegar desde Excel
          </Button>
        </div>
        <LineasTable
          prefijo={`g${index}-`}
          etiqueta={`Materiales y equipos de la empresa ${index + 1}`}
          conPrecio
          lineas={grupo.items.map((it, ii) => ({
            id: String(ii),
            descripcion: it.descripcion,
            cantidad: it.cantidad,
            unidad: it.unidad as UnidadMedida | '',
            precio: it.precioUnitario,
          }))}
          getError={(ii, campo) => errors[`g${index}_i${ii}_${campo === 'precio' ? 'precioUnitario' : campo}`]}
          onChange={(ii, patch) => {
            for (const [campo, valor] of Object.entries(patch)) {
              onChangeItem(ii, (campo === 'precio' ? 'precioUnitario' : campo) as keyof ItemLinea, String(valor ?? ''))
            }
          }}
          onAgregar={agregarFila}
          onQuitar={(ii) => {
            if (grupo.items.length > 1) onRemoveItem(ii)
          }}
          onPegarFilas={insertarFilas}
        />
        <div aria-live="polite">
          {aviso && <p className="mt-2 rounded-lg bg-muted px-3 py-1.5 text-sm">{aviso}</p>}
        </div>
      </div>

      <PegarExcelModal
        open={pegarOpen}
        onOpenChange={setPegarOpen}
        conPrecio
        onConfirm={(filas) => {
          insertarFilas(grupo.items.length - 1, filas)
          setPegarOpen(false)
        }}
      />

      {!esRendicion && (
        <div className="max-w-md">
          <FileField
            label="Cotización o proforma (opcional)"
            file={grupo.cotizacion}
            onChange={(f) => onChange({ cotizacion: f })}
          />
          <p className="mt-1 text-xs text-muted-foreground">Respalda el monto para quien revisa la compra. PDF o imagen.</p>
        </div>
      )}

      <div className="flex justify-end border-t border-border pt-2">
        <p className="text-sm">
          Subtotal empresa: <span className="font-medium">{fmtMoney(total)}</span>
        </p>
      </div>
    </div>
    </div>
  )
}
