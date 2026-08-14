'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Trash2, Building2, Upload } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSession } from '@/lib/auth/session'
import { cn } from '@/lib/utils'
import { UNIDAD_OPTIONS } from '@/lib/inventario'
import type { DestinoPago, MetodoPagoTrabajador, Proyecto, Proveedor, Role, Trabajador, TipoRequerimiento, User } from '@/types/api'

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
}

interface Props {
  proyectos: Proyecto[]
  proveedores: Proveedor[]
}

const labelCn = 'mb-1.5 block text-sm font-medium'
const sectionTitleCn = 'text-xs font-medium uppercase tracking-wide text-muted-foreground'
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
})

const TIPO_LABELS: Record<TipoRequerimiento, string> = {
  civil: 'Civil',
  electrico: 'Eléctrico',
  seguridad: 'Seguridad',
  administrativo: 'Administrativo',
}

// Qué tipos puede registrar cada rol (debe coincidir con ROLE_TIPOS del backend)
const ROLE_TIPOS: Partial<Record<Role, TipoRequerimiento[]>> = {
  supervisor: ['civil'],
  supervisor_civil: ['civil'],
  supervisor_electrico: ['electrico'],
  pdr: ['seguridad'],
  administrador: ['civil', 'electrico', 'seguridad', 'administrativo'],
  admin_ti: ['civil', 'electrico', 'seguridad', 'administrativo'],
}

function fmtMoney(v: number) {
  return `S/ ${v.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function CreateCompraSimpleForm({ proyectos, proveedores }: Props) {
  const { data: session } = useSession()
  const role = (session?.user as { role?: Role } | undefined)?.role
  const allowedTipos = (role ? ROLE_TIPOS[role] : undefined) ?? []

  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState<TipoRequerimiento>(
    allowedTipos.length === 1 ? allowedTipos[0] : 'civil',
  )
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

  function validate() {
    const next: Record<string, string> = {}
    if (!nombre.trim()) next.nombre = 'Ingresa un nombre'
    if (!proyectoId) next.proyectoId = 'Selecciona un proyecto'
    grupos.forEach((g, gi) => {
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
        const price = parseFloat(it.precioUnitario)
        if (!it.precioUnitario || isNaN(price) || price < 0) next[`g${gi}_i${ii}_precioUnitario`] = 'Precio inválido'
      })
    })
    if (esRendicion && !comprobante) next.comprobante = 'Adjunta el comprobante (boleta/factura) de la compra'
    if (esRendicion && !aprobadoInformalPorId) next.aprobadoInformalPorId = 'Selecciona quién aprobó la compra'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError(null)

    try {
      const result = await api.post<{ id: string; grupos: { id: string }[] }>('/compras-simples', {
        nombre: nombre.trim(),
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

      if (esRendicion && comprobante) {
        const grupoId = result.grupos[0]?.id
        if (grupoId) {
          const comprobanteForm = new FormData()
          comprobanteForm.append('archivo', comprobante)
          comprobanteForm.append('tipo', 'comprobante')
          await api.upload(`/compras-simples/grupos/${grupoId}/archivos`, comprobanteForm)

          if (fotoProducto) {
            const fotoForm = new FormData()
            fotoForm.append('archivo', fotoProducto)
            fotoForm.append('tipo', 'foto_producto')
            await api.upload(`/compras-simples/grupos/${grupoId}/archivos`, fotoForm)
          }
        }
      }

      router.push(`/compras-simples/${result.id}`)
      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al crear la compra simple')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
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
              placeholder="Ej: Materiales para cierre de zanja"
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
                  {(value: string | null) => proyectos.find((p) => p.id === value)?.nombre ?? 'Selecciona un proyecto…'}
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
              <div className="flex h-9 items-center rounded-lg border border-border bg-muted/50 px-3 text-sm text-muted-foreground">
                {TIPO_LABELS[tipo]}
              </div>
            ) : (
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoRequerimiento)}>
                <SelectTrigger className="w-full">
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
          </div>

          <div>
            <label className={labelCn}>Nota (opcional)</label>
            <Input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Contexto de la compra…" />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={esRendicion}
            onChange={(e) => {
              const checked = e.target.checked
              setEsRendicion(checked)
              if (checked) {
                setGrupos((p) => {
                  const first = p[0] ?? emptyGrupo()
                  return [{ ...first, destinoPago: 'trabajador' }]
                })
              }
              setErrors((p) => { const n = { ...p }; delete n.comprobante; return n })
            }}
            className="size-4 rounded border-border accent-primary"
          />
          <span className="text-sm font-medium">Marcar como rendición (ya compré, necesito reembolso)</span>
        </label>

        {esRendicion && (
          <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
            <p className="text-xs text-muted-foreground">
              Sube el comprobante de la compra (boleta/factura). El pago se depositará únicamente a ti, no a la empresa.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
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
            </div>
            <div>
              <label className={labelCn}>
                ¿Quién aprobó la compra? <span className="text-destructive">*</span>
              </label>
              <Select
                value={aprobadoInformalPorId}
                onValueChange={(v) => {
                  setAprobadoInformalPorId(v ?? '')
                  setErrors((p) => { const n = { ...p }; delete n.aprobadoInformalPorId; return n })
                }}
              >
                <SelectTrigger className={cn('w-full', errors.aprobadoInformalPorId && 'border-destructive')}>
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
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={sectionTitleCn}>Empresas / grupos de compra</h2>
          {!esRendicion && (
            <button
              type="button"
              onClick={() => setGrupos((p) => [...p, emptyGrupo()])}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors duration-[120ms]"
            >
              <Plus className="size-3.5" />
              Agregar empresa
            </button>
          )}
        </div>

        <div className="space-y-4">
          {grupos.map((g, gi) => (
            <GrupoCard
              key={gi}
              grupo={g}
              index={gi}
              proveedores={proveedores}
              errors={errors}
              canRemove={grupos.length > 1 && !esRendicion}
              esRendicion={esRendicion}
              total={grupoTotal(g)}
              solicitanteNombre={session?.user?.name}
              miTrabajador={miTrabajador}
              miTrabajadorCargado={miTrabajadorCargado}
              onChange={(patch) => updateGrupo(gi, patch)}
              onChangeItem={(ii, field, value) => updateItem(gi, ii, field, value)}
              onAddItem={() => updateGrupo(gi, { items: [...g.items, emptyItem()] })}
              onRemoveItem={(ii) => updateGrupo(gi, { items: g.items.filter((_, idx) => idx !== ii) })}
              onRemoveGrupo={() => setGrupos((p) => p.filter((_, idx) => idx !== gi))}
            />
          ))}
        </div>
      </section>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <p className="mr-auto text-sm text-muted-foreground">
          Total: <span className="font-medium text-foreground">{fmtMoney(grupos.reduce((s, g) => s + grupoTotal(g), 0))}</span>
        </p>
        {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link href="/compras-simples" className={buttonVariants({ variant: 'outline' })}>
          Cancelar
        </Link>
        <Button type="submit" disabled={loading} className="min-w-40">
          {loading ? 'Registrando…' : 'Registrar compra simple'}
        </Button>
      </div>
    </form>
  )
}

interface GrupoCardProps {
  grupo: Grupo
  index: number
  proveedores: Proveedor[]
  errors: Record<string, string>
  canRemove: boolean
  esRendicion: boolean
  total: number
  solicitanteNombre?: string
  miTrabajador: MiTrabajador | null
  miTrabajadorCargado: boolean
  onChange: (patch: Partial<Grupo>) => void
  onChangeItem: (ii: number, field: keyof ItemLinea, value: string) => void
  onAddItem: () => void
  onRemoveItem: (ii: number) => void
  onRemoveGrupo: () => void
}

function FileField({
  label, file, onChange, required, error,
}: { label: string; file: File | null; onChange: (f: File | null) => void; required?: boolean; error?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div>
      <label className={labelCn}>
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
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
  grupo, index, proveedores, errors, canRemove, esRendicion, total, solicitanteNombre, miTrabajador, miTrabajadorCargado,
  onChange, onChangeItem, onAddItem, onRemoveItem, onRemoveGrupo,
}: GrupoCardProps) {
  const proveedorError = errors[`g${index}_proveedor`]

  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-muted-foreground" />
          <p className="text-sm font-medium">Empresa {index + 1}</p>
        </div>
        <button
          type="button"
          onClick={onRemoveGrupo}
          disabled={!canRemove}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors duration-[120ms] disabled:pointer-events-none disabled:opacity-30"
        >
          <Trash2 className="size-3.75" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={grupo.sinProveedor ? 'sm:col-span-2' : ''}>
          <label className={labelCn}>
            {grupo.sinProveedor ? 'Razón social' : 'Proveedor'} <span className="text-destructive">*</span>
          </label>
          {grupo.sinProveedor ? (
            <Input
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
                onChange({
                  proveedorId: v ?? '',
                  pagoBanco: proveedor?.banco ?? '',
                  pagoNumeroCuenta: proveedor?.numeroCuenta ?? '',
                  pagoRazonSocial: proveedor?.razonSocial ?? '',
                })
              }}
            >
              <SelectTrigger className={cn('w-full', proveedorError && 'border-destructive')}>
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
          <label className={labelCn}>Fecha solicitada de pago</label>
          <Input
            type="date"
            value={grupo.fechaEntrega}
            onChange={(e) => onChange({ fechaEntrega: e.target.value })}
          />
          <p className="mt-1 text-xs text-muted-foreground">Para cuándo se necesita pagar a esta empresa</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
        <p className={sectionTitleCn}>Condiciones de pago</p>

        {esRendicion ? (
          <p className="text-xs text-muted-foreground">
            Rendición: el pago se depositará únicamente al solicitante, no a la empresa.
          </p>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onChange({ destinoPago: 'empresa' })}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors duration-[120ms]',
                grupo.destinoPago === 'empresa'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              Depositar a la empresa
            </button>
            <button
              type="button"
              onClick={() => onChange({ destinoPago: 'trabajador' })}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors duration-[120ms]',
                grupo.destinoPago === 'trabajador'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              Depositarme a mí (solicitante)
            </button>
          </div>
        )}

        {!esRendicion && grupo.destinoPago === 'empresa' ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={labelCn}>Banco <span className="text-destructive">*</span></label>
              <Input
                value={grupo.pagoBanco}
                onChange={(e) => onChange({ pagoBanco: e.target.value })}
                placeholder="Ej: BCP"
                className={cn(errors[`g${index}_pagoBanco`] && 'border-destructive')}
              />
              {errors[`g${index}_pagoBanco`] && <p className="mt-1 text-xs text-destructive">{errors[`g${index}_pagoBanco`]}</p>}
            </div>
            <div>
              <label className={labelCn}>N° de cuenta <span className="text-destructive">*</span></label>
              <Input
                value={grupo.pagoNumeroCuenta}
                onChange={(e) => onChange({ pagoNumeroCuenta: e.target.value })}
                className={cn(errors[`g${index}_pagoNumeroCuenta`] && 'border-destructive')}
              />
              {errors[`g${index}_pagoNumeroCuenta`] && <p className="mt-1 text-xs text-destructive">{errors[`g${index}_pagoNumeroCuenta`]}</p>}
            </div>
            <div>
              <label className={labelCn}>Razón social de la cuenta <span className="text-destructive">*</span></label>
              <Input
                value={grupo.pagoRazonSocial}
                onChange={(e) => onChange({ pagoRazonSocial: e.target.value })}
                className={cn(errors[`g${index}_pagoRazonSocial`] && 'border-destructive')}
              />
              {errors[`g${index}_pagoRazonSocial`] && <p className="mt-1 text-xs text-destructive">{errors[`g${index}_pagoRazonSocial`]}</p>}
            </div>
            <p className="sm:col-span-3 text-xs text-muted-foreground">
              Confirma estos datos aunque el proveedor ya los tenga registrados — algunos manejan varias cuentas.
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

      <div className="space-y-2">
        <div className="hidden sm:grid grid-cols-[1fr_90px_100px_110px_90px_32px] gap-2 px-1">
          <p className="text-xs text-muted-foreground font-medium">Descripción</p>
          <p className="text-xs text-muted-foreground font-medium">Cantidad</p>
          <p className="text-xs text-muted-foreground font-medium">Unidad</p>
          <p className="text-xs text-muted-foreground font-medium">P. Unitario</p>
          <p className="text-xs text-muted-foreground font-medium">Subtotal</p>
          <div />
        </div>

        {grupo.items.map((it, ii) => {
          const subtotal = (parseFloat(it.cantidad) || 0) * (parseFloat(it.precioUnitario) || 0)
          const descError = errors[`g${index}_i${ii}_descripcion`]
          const cantError = errors[`g${index}_i${ii}_cantidad`]
          const precioError = errors[`g${index}_i${ii}_precioUnitario`]
          return (
            <div key={ii} className="grid grid-cols-2 sm:grid-cols-[1fr_90px_100px_110px_90px_32px] gap-2 items-start">
              <div className="col-span-2 sm:col-span-1">
                <Input
                  value={it.descripcion}
                  onChange={(e) => onChangeItem(ii, 'descripcion', e.target.value)}
                  placeholder="Descripción del ítem…"
                  className={cn(descError && 'border-destructive')}
                />
              </div>
              <Input
                type="number" min="0.01" step="0.01"
                value={it.cantidad}
                onChange={(e) => onChangeItem(ii, 'cantidad', e.target.value)}
                placeholder="0"
                className={cn(cantError && 'border-destructive')}
              />
              <Select value={it.unidad} onValueChange={(v) => onChangeItem(ii, 'unidad', v ?? 'und')}>
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
                type="number" min="0" step="0.01"
                value={it.precioUnitario}
                onChange={(e) => onChangeItem(ii, 'precioUnitario', e.target.value)}
                placeholder="0.00"
                className={cn(precioError && 'border-destructive')}
              />
              <p className="flex h-9 items-center text-sm tabular-nums text-muted-foreground">{fmtMoney(subtotal)}</p>
              <button
                type="button"
                onClick={() => onRemoveItem(ii)}
                disabled={grupo.items.length === 1}
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors duration-[120ms] disabled:pointer-events-none disabled:opacity-30"
              >
                <Trash2 className="size-3.5" />
              </button>
              {(descError || cantError || precioError) && (
                <p className="col-span-2 sm:col-span-6 text-xs text-destructive">
                  {descError || cantError || precioError}
                </p>
              )}
            </div>
          )
        })}

        <button
          type="button"
          onClick={onAddItem}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-ring hover:text-foreground transition-colors duration-[120ms]"
        >
          <Plus className="size-3.5" />
          Agregar ítem
        </button>
      </div>

      <div className="flex justify-end border-t border-border pt-2">
        <p className="text-sm">
          Subtotal empresa: <span className="font-medium">{fmtMoney(total)}</span>
        </p>
      </div>
    </div>
  )
}
