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
import { UNIDAD_LABELS, UNIDAD_OPTIONS } from '@/lib/inventario'
import type { ItemInventario, TipoItem, UnidadMedida } from '@/types/api'

type FormData = {
  codigo: string
  nombre: string
  descripcion: string
  unidad: UnidadMedida
  categoria: string
  tipo: TipoItem
}

const initial: FormData = {
  codigo: '',
  nombre: '',
  descripcion: '',
  unidad: 'und',
  categoria: '',
  tipo: 'consumible',
}

const labelCn = 'mb-1.5 block text-sm font-medium'

export function CreateItemForm() {
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
    if (!form.codigo.trim()) next.codigo = 'El código es requerido'
    if (!form.nombre.trim()) next.nombre = 'El nombre es requerido'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setServerError(null)

    try {
      const payload: Record<string, unknown> = {
        codigo: form.codigo.trim(),
        nombre: form.nombre.trim(),
        unidad: form.unidad,
        tipo: form.tipo,
      }
      if (form.descripcion.trim()) payload.descripcion = form.descripcion.trim()
      if (form.categoria.trim()) payload.categoria = form.categoria.trim()

      const item = await api.post<ItemInventario>('/inventario', payload)
      router.push(`/almacenes/items/${item.id}`)
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
        <div>
          <label className={labelCn}>
            Código <span className="text-destructive">*</span>
          </label>
          <Input
            value={form.codigo}
            onChange={(e) => set('codigo', e.target.value)}
            placeholder="Ej. MAT-001"
            aria-invalid={!!errors.codigo}
          />
          {errors.codigo && <p className="mt-1 text-xs text-destructive">{errors.codigo}</p>}
        </div>

        <div>
          <label className={labelCn}>Categoría</label>
          <Input
            value={form.categoria}
            onChange={(e) => set('categoria', e.target.value)}
            placeholder="Ej. Cemento y agregados"
          />
        </div>

        <div className="sm:col-span-2">
          <label className={labelCn}>
            Nombre del ítem <span className="text-destructive">*</span>
          </label>
          <Input
            value={form.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            placeholder="Ej. Cemento Portland tipo I 42.5kg"
            aria-invalid={!!errors.nombre}
          />
          {errors.nombre && <p className="mt-1 text-xs text-destructive">{errors.nombre}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className={labelCn}>Descripción</label>
          <Input
            value={form.descripcion}
            onChange={(e) => set('descripcion', e.target.value)}
            placeholder="Detalle adicional (opcional)"
          />
        </div>

        <div>
          <label className={labelCn}>Unidad de medida</label>
          <Select
            value={form.unidad}
            onValueChange={(v) => set('unidad', (v as UnidadMedida) ?? 'und')}
          >
            <SelectTrigger className="w-full">
              <SelectValue>{UNIDAD_LABELS[form.unidad]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {UNIDAD_OPTIONS.map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className={labelCn}>Tipo</label>
          <Select value={form.tipo} onValueChange={(v) => set('tipo', v ?? 'consumible')}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="consumible">Consumible</SelectItem>
              <SelectItem value="activo">Equipo / Activo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {serverError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Link href="/almacenes/items" className={buttonVariants({ variant: 'outline' })}>
          Cancelar
        </Link>
        <Button type="submit" disabled={loading} className="min-w-24">
          {loading ? 'Guardando...' : 'Crear ítem'}
        </Button>
      </div>
    </form>
  )
}
