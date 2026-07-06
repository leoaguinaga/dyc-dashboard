'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Cliente } from '@/types/api'

type FormData = {
  razonSocial: string
  nombreComercial: string
  ruc: string
  direccion: string
}

const initial: FormData = {
  razonSocial: '',
  nombreComercial: '',
  ruc: '',
  direccion: '',
}

const labelCn = 'mb-1.5 block text-sm font-medium'

export function CreateClienteForm() {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
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
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== ''),
      )
      const cliente = await api.post<Cliente>('/clientes', payload)
      router.push(`/clientes/${cliente.id}`)
      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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

      {serverError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Link href="/clientes" className={buttonVariants({ variant: 'outline' })}>
          Cancelar
        </Link>
        <Button type="submit" disabled={loading} className="min-w-24">
          {loading ? 'Guardando...' : 'Crear cliente'}
        </Button>
      </div>
    </form>
  )
}
