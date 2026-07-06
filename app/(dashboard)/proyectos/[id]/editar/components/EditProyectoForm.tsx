'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TrabajadorCombobox } from '@/components/ui/trabajador-combobox'
import { PERU_UBIGEO } from '@/lib/peru-ubigeo'
import type { Cliente, ContactoCliente, Proyecto, Trabajador } from '@/types/api'

interface Props {
  proyecto: Proyecto
  clientes: Cliente[]
  trabajadores: Trabajador[]
  proyectos: Proyecto[]
}

type FormData = {
  codigo: string
  nombre: string
  parentId: string
  clienteId: string
  ambitoGeografico: string
  ciudad: string
  direccion: string
  comuna: string
  coordinadorClienteId: string
  coordinadorEmpresaId: string
  ejecutorId: string
  prevencionistaId: string
  fechaInicio: string
  fechaFin: string
  fechaInicioReal: string
  fechaFinReal: string
  notaInicioReal: string
  estado: Proyecto['estado']
}

type FormErrors = Partial<Record<keyof FormData, string>>

const labelCn = 'mb-1.5 block text-sm font-medium'
const sectionTitleCn = 'text-xs font-medium uppercase tracking-wide text-muted-foreground'

function toDateInput(iso?: string) {
  return iso ? iso.slice(0, 10) : ''
}

export function EditProyectoForm({ proyecto: o, clientes, trabajadores, proyectos }: Props) {
  const router = useRouter()

  const [form, setForm] = useState<FormData>({
    codigo: o.codigo ?? '',
    nombre: o.nombre,
    parentId: o.parentId ?? '',
    clienteId: o.clienteId ?? '',
    ambitoGeografico: o.ambitoGeografico ?? 'local',
    ciudad: o.ciudad ?? '',
    direccion: o.direccion ?? '',
    comuna: o.comuna ?? '',
    coordinadorClienteId: o.coordinadorClienteId ?? '',
    coordinadorEmpresaId: o.coordinadorEmpresaId ?? '',
    ejecutorId: o.ejecutorId ?? '',
    prevencionistaId: o.prevencionistaId ?? '',
    fechaInicio: toDateInput(o.fechaInicio),
    fechaFin: toDateInput(o.fechaFin),
    fechaInicioReal: toDateInput(o.fechaInicioReal),
    fechaFinReal: toDateInput(o.fechaFinReal),
    notaInicioReal: o.notaInicioReal ?? '',
    estado: o.estado,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [contactos, setContactos] = useState<ContactoCliente[]>(
    o.coordinadorCliente
      ? [{ id: o.coordinadorCliente.id, nombre: o.coordinadorCliente.nombre, cargo: o.coordinadorCliente.cargo, activo: true, clienteId: o.clienteId ?? '', creadoEn: '' }]
      : [],
  )

  const distritos = PERU_UBIGEO.find((d) => d.nombre === form.ciudad)?.distritos ?? []
  const showLocalFields = form.ambitoGeografico === 'local'
  const datesDiffer = form.fechaInicio && form.fechaInicioReal && form.fechaInicioReal !== form.fechaInicio

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  async function handleClienteChange(clienteId: string) {
    set('clienteId', clienteId)
    set('coordinadorClienteId', '')
    if (!clienteId) { setContactos([]); return }
    const data = await api.get<ContactoCliente[]>(`/clientes/${clienteId}/contactos`).catch(() => [])
    setContactos(data)
  }

  function handleDepartamentoChange(depto: string) {
    set('ciudad', depto)
    set('comuna', '')
  }

  function handleAmbitoChange(ambito: string) {
    set('ambitoGeografico', ambito)
    if (ambito !== 'local') {
      set('ciudad', '')
      set('comuna', '')
    }
  }

  function validate(): boolean {
    const next: FormErrors = {}
    if (!form.nombre.trim()) next.nombre = 'El nombre es requerido'
    if (form.fechaInicio && form.fechaFin && form.fechaFin < form.fechaInicio)
      next.fechaFin = 'La fecha fin no puede ser anterior al inicio'
    if (form.fechaInicioReal && form.fechaFinReal && form.fechaFinReal < form.fechaInicioReal)
      next.fechaFinReal = 'La fecha fin real no puede ser anterior al inicio real'
    if (datesDiffer && !form.notaInicioReal.trim())
      next.notaInicioReal = 'Explica la diferencia entre la fecha programada y la real'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setServerError(null)

    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== ''),
      )
      await api.patch<Proyecto>(`/proyectos/${o.id}`, payload)
      router.push(`/proyectos/${o.id}`)
      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al guardar los cambios')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 bg-white">

      {/* Identificacion */}
      <section className="space-y-4">
        <h2 className={sectionTitleCn}>Identificacion</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCn}>Codigo de proyecto</label>
            <Input
              value={form.codigo}
              onChange={(e) => set('codigo', e.target.value)}
              placeholder="Ej. PRY-2025-001"
            />
          </div>
          <div>
            <label className={labelCn}>
              Nombre del proyecto <span className="text-destructive">*</span>
            </label>
            <Input
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              placeholder="Ej. Edificio Costanera Norte"
              aria-invalid={!!errors.nombre}
            />
            {errors.nombre && <p className="mt-1 text-xs text-destructive">{errors.nombre}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCn}>Cliente</label>
            <Select value={form.clienteId} onValueChange={(v) => handleClienteChange(v ?? '')}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar cliente..." />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nombreComercial ?? c.razonSocial}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className={labelCn}>Estado</label>
            <Select value={form.estado} onValueChange={(v) => set('estado', v ?? '')}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planificacion">Planificacion</SelectItem>
                <SelectItem value="ejecucion">Ejecucion</SelectItem>
                <SelectItem value="cierre">Cierre</SelectItem>
                <SelectItem value="liquidada">Liquidada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className={labelCn}>
            Proyecto padre{' '}
            <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Select value={form.parentId} onValueChange={(v) => set('parentId', v ?? '')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sin proyecto padre" />
            </SelectTrigger>
            <SelectContent>
              {proyectos.filter((p) => !p.parentId && p.id !== o.id).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.codigo ? `${p.codigo} — ` : ''}{p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Ubicacion */}
      <section className="space-y-4">
        <h2 className={sectionTitleCn}>Ubicacion</h2>
        <div>
          <label className={labelCn}>Ambito geografico</label>
          <Select value={form.ambitoGeografico} onValueChange={(v) => handleAmbitoChange(v ?? '')}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">Local (departamento/distrito)</SelectItem>
              <SelectItem value="nacional">Nacional</SelectItem>
              <SelectItem value="internacional">Internacional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {showLocalFields && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCn}>Departamento</label>
              <Select value={form.ciudad} onValueChange={(v) => handleDepartamentoChange(v ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar departamento..." />
                </SelectTrigger>
                <SelectContent>
                  {PERU_UBIGEO.map((d) => (
                    <SelectItem key={d.nombre} value={d.nombre}>{d.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={labelCn}>Distrito</label>
              <Select
                value={form.comuna}
                onValueChange={(v) => set('comuna', v ?? '')}
                disabled={!form.ciudad}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={form.ciudad ? 'Seleccionar distrito...' : 'Elige un departamento primero'} />
                </SelectTrigger>
                <SelectContent>
                  {distritos.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div>
          <label className={labelCn}>Direccion</label>
          <Input
            value={form.direccion}
            onChange={(e) => set('direccion', e.target.value)}
            placeholder="Ej. Panamericana Norte Km 754"
          />
        </div>
      </section>

      {/* Personas asignadas */}
      <section className="space-y-4">
        <h2 className={sectionTitleCn}>Personas asignadas</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCn}>Coordinador del cliente</label>
            <Select
              value={form.coordinadorClienteId}
              onValueChange={(v) => set('coordinadorClienteId', v ?? '')}
              disabled={!form.clienteId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={form.clienteId ? 'Sin asignar' : 'Sin cliente seleccionado'} />
              </SelectTrigger>
              <SelectContent>
                {contactos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre}{c.cargo ? ` — ${c.cargo}` : ''}
                  </SelectItem>
                ))}
                {contactos.length === 0 && form.clienteId && (
                  <SelectItem value="__none__" disabled>Sin contactos registrados</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className={labelCn}>Coordinador de la empresa</label>
            <TrabajadorCombobox
              trabajadores={trabajadores}
              value={form.coordinadorEmpresaId}
              onValueChange={(v) => set('coordinadorEmpresaId', v)}
              placeholder="Seleccionar coordinador..."
            />
          </div>
          <div>
            <label className={labelCn}>Ejecutor</label>
            <TrabajadorCombobox
              trabajadores={trabajadores}
              value={form.ejecutorId}
              onValueChange={(v) => set('ejecutorId', v)}
              placeholder="Seleccionar ejecutor..."
            />
          </div>
          <div>
            <label className={labelCn}>Prevencionista asignado</label>
            <TrabajadorCombobox
              trabajadores={trabajadores}
              value={form.prevencionistaId}
              onValueChange={(v) => set('prevencionistaId', v)}
              placeholder="Seleccionar prevencionista..."
            />
          </div>
        </div>
      </section>

      {/* Fechas */}
      <section className="space-y-4">
        <h2 className={sectionTitleCn}>Fechas</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCn}>Inicio programado</label>
            <DatePicker
              value={form.fechaInicio}
              onValueChange={(v) => set('fechaInicio', v ?? '')}
              placeholder="Seleccionar fecha"
            />
          </div>
          <div>
            <label className={labelCn}>Fin programado</label>
            <DatePicker
              value={form.fechaFin}
              onValueChange={(v) => set('fechaFin', v ?? '')}
              placeholder="Seleccionar fecha"
              aria-invalid={!!errors.fechaFin}
            />
            {errors.fechaFin && <p className="mt-1 text-xs text-destructive">{errors.fechaFin}</p>}
          </div>
          <div>
            <label className={labelCn}>
              Inicio real{' '}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <DatePicker
              value={form.fechaInicioReal}
              onValueChange={(v) => set('fechaInicioReal', v ?? '')}
              placeholder="Seleccionar fecha"
            />
          </div>
          <div>
            <label className={labelCn}>
              Fin real{' '}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <DatePicker
              value={form.fechaFinReal}
              onValueChange={(v) => set('fechaFinReal', v ?? '')}
              placeholder="Seleccionar fecha"
              aria-invalid={!!errors.fechaFinReal}
            />
            {errors.fechaFinReal && <p className="mt-1 text-xs text-destructive">{errors.fechaFinReal}</p>}
          </div>
        </div>

        {datesDiffer && (
          <div>
            <label className={labelCn}>
              Nota sobre inicio real <span className="text-destructive">*</span>
            </label>
            <textarea
              value={form.notaInicioReal}
              onChange={(e) => set('notaInicioReal', e.target.value)}
              placeholder="Explica por que la fecha de inicio real difiere de la programada..."
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 outline-none focus:border-ring focus:ring-3 focus:ring-ring/20 transition-[border-color,box-shadow] duration-[120ms] resize-none"
              aria-invalid={!!errors.notaInicioReal}
            />
            {errors.notaInicioReal && <p className="mt-1 text-xs text-destructive">{errors.notaInicioReal}</p>}
          </div>
        )}
      </section>

      {serverError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <a
          href={`/proyectos/${o.id}`}
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Cancelar
        </a>
        <Button type="submit" disabled={loading} className="min-w-28">
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}
