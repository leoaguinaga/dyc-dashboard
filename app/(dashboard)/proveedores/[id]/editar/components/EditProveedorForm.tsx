'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { CATEGORIAS_PROVEEDOR } from '@/lib/proveedores'
import { PERU_UBIGEO } from '@/lib/peru-ubigeo'
import { cn } from '@/lib/utils'
import type { Proveedor } from '@/types/api'

type FormState = {
  razonSocial: string
  ruc: string
  direccion: string
  departamento: string
  distrito: string
  rubro: string
  categoria: string
  banco: string
  numeroCuenta: string
  moneda: string
  condicionPago: string
  activo: boolean
}

type FormErrors = Partial<Record<keyof FormState, string>>

const labelCn = 'mb-1.5 block text-[13px] font-medium'
const sectionTitleCn = 'text-sm font-medium uppercase tracking-wide text-muted-foreground'

const BANCOS_FRECUENTES = [
  'BCP',
  'BBVA',
  'Interbank',
  'Scotiabank',
  'BanBif',
  'Banco de la Nación',
]

const CONDICIONES_COMUNES = [
  'Contado',
  'Crédito 15 días',
  'Crédito 30 días',
  '50% adelanto / 50% entrega',
]

function validate(form: FormState): FormErrors {
  const next: FormErrors = {}
  if (!form.razonSocial.trim()) next.razonSocial = 'La razón social es requerida'
  if (!form.departamento) next.departamento = 'El departamento es requerido'
  return next
}

interface Props {
  proveedor: Proveedor
}

export function EditProveedorForm({ proveedor }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    razonSocial: proveedor.razonSocial,
    ruc: proveedor.ruc ?? '',
    direccion: proveedor.direccion ?? '',
    departamento: proveedor.departamento ?? '',
    distrito: proveedor.distrito ?? '',
    rubro: proveedor.rubro ?? '',
    categoria: proveedor.categoria ?? '',
    banco: proveedor.banco ?? '',
    numeroCuenta: proveedor.numeroCuenta ?? '',
    moneda: proveedor.moneda ?? '',
    condicionPago: proveedor.condicionPago ?? '',
    activo: proveedor.activo,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const distritos =
    PERU_UBIGEO.find((d) => d.nombre === form.departamento)?.distritos ?? []

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleDepartamentoChange(depto: string) {
    set('departamento', depto)
    set('distrito', '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    setServerError(null)

    const payload: Record<string, unknown> = {
      razonSocial: form.razonSocial.trim(),
      ruc: form.ruc.trim() || null,
      activo: form.activo,
      direccion: form.direccion.trim() || null,
      departamento: form.departamento,
      distrito: form.distrito.trim() || null,
      rubro: form.rubro.trim() || null,
      categoria: form.categoria || null,
      banco: form.banco.trim() || null,
      numeroCuenta: form.numeroCuenta.trim() || null,
      moneda: form.moneda || null,
      condicionPago: form.condicionPago.trim() || null,
    }

    try {
      await api.patch(`/proveedores/${proveedor.id}`, payload)
      router.push(`/proveedores/${proveedor.id}`)
      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al guardar los cambios')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Columna Izquierda: Identificación y Ubicación */}
        <div className="space-y-6 lg:border-r lg:pr-8">
          {/* Sección: Empresa y actividad */}
          <section className="space-y-4">
            <h2 className={sectionTitleCn}>Empresa y actividad</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelCn}>
                  Razón social <span className="text-destructive">*</span>
                </label>
                <Input
                  value={form.razonSocial}
                  onChange={(e) => set('razonSocial', e.target.value)}
                  placeholder="Ej. Construcciones del Pacífico S.A.C."
                  className={cn(errors.razonSocial && 'border-destructive')}
                  aria-invalid={!!errors.razonSocial}
                />
                {errors.razonSocial && (
                  <p className="mt-1 text-xs text-destructive">{errors.razonSocial}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className={labelCn}>RUC</label>
                  <span className="text-xs text-muted-foreground">Opcional</span>
                </div>
                <Input
                  value={form.ruc}
                  onChange={(e) => set('ruc', e.target.value)}
                  placeholder="20123456789"
                  className={cn('font-mono tracking-wide', errors.ruc && 'border-destructive')}
                  maxLength={11}
                  aria-invalid={!!errors.ruc}
                />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Requerido para emitir órdenes de compra
                </p>
              </div>

              <div>
                <label className={labelCn}>Categoría</label>
                <Select value={form.categoria} onValueChange={(v) => set('categoria', v ?? '')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar…" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_PROVEEDOR.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2">
                <label className={labelCn}>Rubro / giro del negocio</label>
                <Input
                  value={form.rubro}
                  onChange={(e) => set('rubro', e.target.value)}
                  placeholder="Ej. Distribución de materiales eléctricos y ferretería industrial"
                />
              </div>
            </div>
          </section>

          {/* Sección: Ubicación y domicilio */}
          <section className="space-y-4">
            <h2 className={sectionTitleCn}>Ubicación y domicilio</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCn}>
                  Departamento <span className="text-destructive">*</span>
                </label>
                <Select
                  value={form.departamento}
                  onValueChange={(v) => handleDepartamentoChange(v ?? '')}
                >
                  <SelectTrigger
                    className={cn('w-full', errors.departamento && 'border-destructive')}
                    aria-invalid={!!errors.departamento}
                  >
                    <SelectValue placeholder="Seleccionar departamento..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PERU_UBIGEO.map((d) => (
                      <SelectItem key={d.nombre} value={d.nombre}>
                        {d.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departamento && (
                  <p className="mt-1 text-xs text-destructive">{errors.departamento}</p>
                )}
              </div>

              <div>
                <label className={labelCn}>Distrito</label>
                <Select
                  value={form.distrito}
                  onValueChange={(v) => set('distrito', v ?? '')}
                  disabled={!form.departamento}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        form.departamento
                          ? 'Seleccionar distrito...'
                          : 'Elige un departamento primero'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {distritos.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2">
                <label className={labelCn}>Dirección fiscal o almacén</label>
                <Input
                  value={form.direccion}
                  onChange={(e) => set('direccion', e.target.value)}
                  placeholder="Ej. Av. Industrial 456, Parque Industrial"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Columna Derecha: Finanzas, Condiciones y Estado */}
        <div className="space-y-6">
          {/* Sección: Datos bancarios */}
          <section className="space-y-4">
            <h2 className={sectionTitleCn}>Datos bancarios</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCn}>Banco</label>
                <Input
                  value={form.banco}
                  onChange={(e) => set('banco', e.target.value)}
                  placeholder="Ej. BCP, BBVA, Interbank…"
                />
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {BANCOS_FRECUENTES.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => set('banco', form.banco === b ? '' : b)}
                      className={cn(
                        'rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors',
                        form.banco === b
                          ? 'border-primary/50 bg-primary/10 text-primary'
                          : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCn}>Moneda</label>
                <Select value={form.moneda} onValueChange={(v) => set('moneda', v ?? '')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOLES">Soles (PEN)</SelectItem>
                    <SelectItem value="DOLARES">Dólares (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2">
                <label className={labelCn}>N° de cuenta o CCI</label>
                <Input
                  value={form.numeroCuenta}
                  onChange={(e) => set('numeroCuenta', e.target.value)}
                  placeholder="Ej. 193-4198421-0-91 / CCI: 002-193..."
                  className="font-mono"
                />
              </div>
            </div>
          </section>

          {/* Sección: Condiciones comerciales y estado */}
          <section className="space-y-4">
            <h2 className={sectionTitleCn}>Condiciones y estado</h2>

            <div>
              <label className={labelCn}>Condición de pago por defecto</label>
              <Input
                value={form.condicionPago}
                onChange={(e) => set('condicionPago', e.target.value)}
                placeholder="Ej. Contado, Crédito 30 días…"
              />
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {CONDICIONES_COMUNES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() =>
                      set('condicionPago', form.condicionPago === c ? '' : c)
                    }
                    className={cn(
                      'rounded-md border px-2 py-0.5 text-[11px] font-medium transition-colors',
                      form.condicionPago === c
                        ? 'border-primary/50 bg-primary/10 text-primary'
                        : 'border-border bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3.5 bg-muted/20">
              <div>
                <p className="text-sm font-medium">
                  Estado:{' '}
                  <span
                    className={
                      form.activo
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-muted-foreground font-semibold'
                    }
                  >
                    {form.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {form.activo
                    ? 'Disponible para solicitar cotizaciones y emitir órdenes de compra.'
                    : 'Deshabilitado temporalmente para nuevas operaciones.'}
                </p>
              </div>
              <Switch
                checked={form.activo}
                onCheckedChange={(v) => set('activo', v)}
              />
            </div>
          </section>
        </div>
      </div>

      {serverError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
        <Link
          href={`/proveedores/${proveedor.id}`}
          className={cn(buttonVariants({ variant: 'outline' }), 'mr-auto')}
        >
          Cancelar
        </Link>
        <Button type="submit" disabled={loading} className="min-w-36">
          {loading ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}
