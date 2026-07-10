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
import { CATEGORIAS_PROVEEDOR } from '@/lib/proveedores'

type FormState = {
  razonSocial: string
  ruc: string
  direccion: string
  rubro: string
  categoria: string
  banco: string
  numeroCuenta: string
  moneda: string
  condicionPago: string
  activo: boolean
}

const initial: FormState = {
  razonSocial: '',
  ruc: '',
  direccion: '',
  rubro: '',
  categoria: '',
  banco: '',
  numeroCuenta: '',
  moneda: '',
  condicionPago: '',
  activo: true,
}

const labelCn = 'mb-1.5 block text-sm font-medium'

type FormErrors = Partial<Record<keyof FormState, string>>

export function CreateProveedorForm() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(initial)
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate(): FormErrors {
    const next: FormErrors = {}
    if (!form.razonSocial.trim()) next.razonSocial = 'La razón social es requerida'
    return next
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    setServerError(null)

    const payload: Record<string, unknown> = {
      razonSocial: form.razonSocial.trim(),
      activo: form.activo,
    }
    if (form.ruc.trim()) payload.ruc = form.ruc.trim()
    if (form.direccion.trim()) payload.direccion = form.direccion.trim()
    if (form.rubro.trim()) payload.rubro = form.rubro.trim()
    if (form.categoria) payload.categoria = form.categoria
    if (form.banco.trim()) payload.banco = form.banco.trim()
    if (form.numeroCuenta.trim()) payload.numeroCuenta = form.numeroCuenta.trim()
    if (form.moneda) payload.moneda = form.moneda
    if (form.condicionPago.trim()) payload.condicionPago = form.condicionPago.trim()

    try {
      await api.post('/proveedores', payload)
      router.push('/proveedores')
      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al registrar el proveedor')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCn}>
            Razón social <span className="text-destructive">*</span>
          </label>
          <Input
            value={form.razonSocial}
            onChange={(e) => set('razonSocial', e.target.value)}
            placeholder="Ej. Construcciones del Pacífico S.A.C."
            aria-invalid={!!errors.razonSocial}
          />
          {errors.razonSocial && (
            <p className="mt-1 text-xs text-destructive">{errors.razonSocial}</p>
          )}
        </div>

        <div>
          <label className={labelCn}>RUC</label>
          <Input
            value={form.ruc}
            onChange={(e) => set('ruc', e.target.value)}
            placeholder="20123456789"
            className="font-mono"
            aria-invalid={!!errors.ruc}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Opcional al registrar. Se requiere para emitir una orden de compra.
          </p>
        </div>

        <div>
          <label className={labelCn}>Estado</label>
          <Select
            value={form.activo ? 'activo' : 'inactivo'}
            onValueChange={(v) => set('activo', v === 'activo')}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="inactivo">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className={labelCn}>Categoría</label>
          <Select value={form.categoria} onValueChange={(v) => set('categoria', v ?? '')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar…" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS_PROVEEDOR.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-2">
          <label className={labelCn}>Rubro / giro del negocio</label>
          <Input
            value={form.rubro}
            onChange={(e) => set('rubro', e.target.value)}
            placeholder="Ej. Compañía especializada en la venta de puertas de metal"
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelCn}>Dirección</label>
          <Input
            value={form.direccion}
            onChange={(e) => set('direccion', e.target.value)}
            placeholder="Ej. Av. Industrial 456, Lima"
          />
        </div>

        <div>
          <label className={labelCn}>Banco</label>
          <Input
            value={form.banco}
            onChange={(e) => set('banco', e.target.value)}
            placeholder="Ej. BCP"
          />
        </div>

        <div>
          <label className={labelCn}>Moneda</label>
          <Select value={form.moneda} onValueChange={(v) => set('moneda', v ?? '')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccionar…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SOLES">Soles</SelectItem>
              <SelectItem value="DOLARES">Dólares</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-2">
          <label className={labelCn}>N° de cuenta / CCI</label>
          <Input
            value={form.numeroCuenta}
            onChange={(e) => set('numeroCuenta', e.target.value)}
            placeholder="Ej. 1934198421091"
            className="font-mono"
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelCn}>Condición de pago por defecto</label>
          <Input
            value={form.condicionPago}
            onChange={(e) => set('condicionPago', e.target.value)}
            placeholder="Ej. 50% adelanto, 50% contra entrega"
          />
        </div>
      </div>

      {serverError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <Link href="/proveedores" className={buttonVariants({ variant: 'outline' })}>
          Cancelar
        </Link>
        <Button type="submit" disabled={loading} className="min-w-36">
          {loading ? 'Guardando…' : 'Registrar proveedor'}
        </Button>
      </div>
    </form>
  )
}
