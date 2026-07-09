'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckIcon, ChevronRightIcon } from 'lucide-react'
import { api } from '@/lib/api/client'
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

const initial: FormData = {
  codigo: '',
  nombre: '',
  parentId: '',
  clienteId: '',
  ambitoGeografico: 'local',
  ciudad: '',
  direccion: '',
  comuna: '',
  coordinadorClienteId: '',
  coordinadorEmpresaId: '',
  ejecutorId: '',
  prevencionistaId: '',
  fechaInicio: '',
  fechaFin: '',
  fechaInicioReal: '',
  fechaFinReal: '',
  notaInicioReal: '',
  estado: 'planificacion',
}

const labelCn = 'mb-1.5 block text-sm font-medium'

type StepErrors = Partial<Record<keyof FormData, string>>

const STEPS = [
  {
    title: 'Identificacion',
    description: 'Datos principales del proyecto',
    optional: false,
  },
  {
    title: 'Ubicacion',
    description: 'Donde se ejecutara el proyecto',
    optional: true,
  },
  {
    title: 'Personas asignadas',
    description: 'Responsables del proyecto',
    optional: true,
  },
  {
    title: 'Fechas',
    description: 'Plazos programados y reales',
    optional: true,
  },
]

export function CreateProyectoForm({ clientes, trabajadores, proyectos }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(initial)
  const [errors, setErrors] = useState<StepErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [contactos, setContactos] = useState<ContactoCliente[]>([])

  const distritos =
    PERU_UBIGEO.find((d) => d.nombre === form.ciudad)?.distritos ?? []

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

  function validateStep(idx: number): StepErrors {
    const next: StepErrors = {}
    if (idx === 0) {
      if (!form.nombre.trim()) next.nombre = 'El nombre es requerido'
      if (!form.clienteId) next.clienteId = 'El cliente es requerido'
    }
    if (idx === 3) {
      if (form.fechaInicio && form.fechaFin && form.fechaFin < form.fechaInicio)
        next.fechaFin = 'La fecha fin no puede ser anterior al inicio'
      if (form.fechaInicioReal && form.fechaFinReal && form.fechaFinReal < form.fechaInicioReal)
        next.fechaFinReal = 'La fecha fin real no puede ser anterior al inicio real'
      if (datesDiffer && !form.notaInicioReal.trim())
        next.notaInicioReal = 'Explica la diferencia entre la fecha programada y la real'
    }
    return next
  }

  function goNext() {
    const errs = validateStep(step)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    if (step < STEPS.length - 1) { setStep(step + 1); return }
    submit()
  }

  function goBack() {
    setErrors({})
    setStep((s) => s - 1)
  }

  function skip() {
    setErrors({})
    setStep((s) => s + 1)
  }

  async function submit() {
    setLoading(true)
    setServerError(null)
    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== ''),
      )
      await api.post<Proyecto>('/proyectos', payload)
      router.push('/proyectos')
      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error inesperado')
      setLoading(false)
    }
  }

  const isLast = step === STEPS.length - 1

  return (
    <div className="flex flex-col gap-8">

      {/* Stepper header */}
      <div>
        <div className="flex items-center gap-0">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                onClick={() => {
                  if (i < step) { setErrors({}); setStep(i) }
                }}
                disabled={i > step}
                className="relative flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                style={{
                  borderColor: i < step ? 'var(--primary)' : i === step ? 'var(--primary)' : 'var(--border)',
                  backgroundColor: i < step ? 'var(--primary)' : i === step ? 'var(--primary)' : 'transparent',
                  color: i <= step ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                }}
                aria-label={s.title}
                aria-current={i === step ? 'step' : undefined}
              >
                {i < step ? <CheckIcon className="size-3.5" /> : i + 1}
              </button>

              {i < STEPS.length - 1 && (
                <div className="h-px flex-1 mx-2 transition-colors" style={{
                  backgroundColor: i < step ? 'var(--primary)' : 'var(--border)',
                }} />
              )}
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{STEPS[step].title}</p>
            {STEPS[step].optional && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                Opcional
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{STEPS[step].description}</p>
        </div>
      </div>

      {/* Step content */}
      <div className="">

        {/* Step 1 — Identificacion */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCn}>Codigo de proyecto</label>
                <Input
                  value={form.codigo}
                  onChange={(e) => set('codigo', e.target.value)}
                  placeholder="Ej. 001-ING-26"
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
                {errors.nombre && (
                  <p className="mt-1 text-xs text-destructive">{errors.nombre}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCn}>
                  Cliente <span className="text-destructive">*</span>
                </label>
                <Select
                  value={form.clienteId}
                  onValueChange={(v) => handleClienteChange(v ?? '')}
                >
                  <SelectTrigger className="w-full" aria-invalid={!!errors.clienteId}>
                    <SelectValue placeholder="Seleccionar cliente...">
                      <option>{form.clienteId ? clientes.find((x) => x.id === form.clienteId)?.nombreComercial ?? clientes.find((x) => x.id === form.clienteId)?.razonSocial : 'Seleccionar cliente...'}</option>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nombreComercial ?? c.razonSocial}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.clienteId && (
                  <p className="mt-1 text-xs text-destructive">{errors.clienteId}</p>
                )}
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
                <span className="text-muted-foreground font-normal">(opcional, para subproyectos)</span>
              </label>
              <Select value={form.parentId} onValueChange={(v) => set('parentId', v ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin proyecto padre">
                    {(value: string) => {
                      const p = proyectos.find((pr) => pr.id === value)
                      return p ? `${p.codigo ? `${p.codigo} — ` : ''}${p.nombre}` : 'Sin proyecto padre'
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {proyectos.filter((p) => !p.parentId).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.codigo ? `${p.codigo} — ` : ''}{p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2 — Ubicacion */}
        {step === 1 && (
          <div className="space-y-4">
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
                  <Select
                    value={form.ciudad}
                    onValueChange={(v) => handleDepartamentoChange(v ?? '')}
                  >
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
          </div>
        )}

        {/* Step 3 — Personas asignadas */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCn}>Coordinador del cliente</label>
                <Select
                  value={form.coordinadorClienteId}
                  onValueChange={(v) => set('coordinadorClienteId', v ?? '')}
                  disabled={!form.clienteId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={form.clienteId ? 'Sin asignar' : 'Sin cliente seleccionado'}>
                      {form.coordinadorClienteId
                        ? (() => { const c = contactos.find((x) => x.id === form.coordinadorClienteId); return c ? `${c.nombre}${c.cargo ? ` — ${c.cargo}` : ''}` : null })()
                        : null}
                    </SelectValue>
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
          </div>
        )}

        {/* Step 4 — Fechas */}
        {step === 3 && (
          <div className="space-y-4">
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
          </div>
        )}
      </div>

      {serverError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      {/* Footer navigation */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <div>
          {step > 0 && (
            <Button type="button" variant="outline" onClick={goBack} disabled={loading}>
              Atras
            </Button>
          )}
          {step === 0 && (
            <Link href="/proyectos" className={buttonVariants({ variant: 'outline' })}>
              Cancelar
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          {STEPS[step].optional && !isLast && (
            <Button type="button" variant="ghost" onClick={skip} disabled={loading}>
              Omitir
            </Button>
          )}
          <Button type="button" onClick={goNext} disabled={loading} className="min-w-28 gap-1.5">
            {loading ? 'Guardando...' : isLast ? 'Crear proyecto' : (
              <>Siguiente <ChevronRightIcon className="size-3.5" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
