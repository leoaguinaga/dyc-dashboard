'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/client'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { Cliente } from '@/types/api'

type FormState = {
  razonSocial: string
  nombreComercial: string
  ruc: string
  direccion: string
  activo: boolean
}

const labelCn = 'mb-1.5 block text-sm font-medium'

interface Props {
  cliente: Cliente
}

export function EditClienteForm({ cliente: c }: Props) {
  const router = useRouter()

  const [form, setForm] = useState<FormState>({
    razonSocial: c.razonSocial,
    nombreComercial: c.nombreComercial ?? '',
    ruc: c.ruc ?? '',
    direccion: c.direccion ?? '',
    activo: c.activo,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate() {
    const next: typeof errors = {}
    if (!form.razonSocial.trim()) next.razonSocial = 'La razón social es requerida'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError(null)

    try {
      await api.patch(`/clientes/${c.id}`, {
        razonSocial: form.razonSocial.trim(),
        nombreComercial: form.nombreComercial.trim() || null,
        activo: form.activo,
        ruc: form.ruc.trim() || null,
        direccion: form.direccion.trim() || null,
      })
      router.push(`/clientes/${c.id}`)
      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al guardar los cambios')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCn}>
            Razón Social <span className="text-destructive">*</span>
          </label>
          <Input
            value={form.razonSocial}
            onChange={(e) => set('razonSocial', e.target.value)}
            placeholder="Ej. Adidas Perú S.A.C."
            aria-invalid={!!errors.razonSocial}
          />
          {errors.razonSocial && (
            <p className="mt-1 text-xs text-destructive">{errors.razonSocial}</p>
          )}
        </div>

        <div>
          <label className={labelCn}>Nombre Comercial</label>
          <Input
            value={form.nombreComercial}
            onChange={(e) => set('nombreComercial', e.target.value)}
            placeholder="Ej. Adidas"
          />
        </div>

        <div>
          <label className={labelCn}>RUC</label>
          <Input
            value={form.ruc}
            onChange={(e) => set('ruc', e.target.value)}
            placeholder="20913404343"
            className="font-mono"
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelCn}>Dirección</label>
          <Input
            value={form.direccion}
            onChange={(e) => set('direccion', e.target.value)}
            placeholder="Av. Providencia 1234, Santiago"
          />
        </div>
      </div>

      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-3">
        <div>
          <p className="text-sm font-semibold text-destructive">Zona de peligro</p>
          <p className="text-xs text-destructive/80 mt-0.5">
            Los cambios en esta sección afectan la disponibilidad del cliente en el sistema.
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-md border border-destructive/20 bg-white px-4 py-3">
          <div>
            <p className="text-sm font-medium">
              Estado: <span className={form.activo ? 'text-chart-2' : 'text-destructive'}>{form.activo ? 'Activo' : 'Inactivo'}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {form.activo
                ? 'El cliente puede ser asignado a nuevos proyectos.'
                : 'El cliente no estará disponible para asignarle proyectos.'}
            </p>
          </div>
          <Switch
            checked={form.activo}
            onCheckedChange={(v) => set('activo', v)}
          />
        </div>
      </div>

      {serverError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <a
          href={`/clientes/${c.id}`}
          className={cn(buttonVariants({ variant: 'outline' }))}
        >
          Cancelar
        </a>
        <Button type="submit" disabled={loading} className="min-w-28">
          {loading ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}
