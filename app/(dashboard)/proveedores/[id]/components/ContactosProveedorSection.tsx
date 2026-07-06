'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, UserCircle2, Star } from 'lucide-react'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ContactoProveedor } from '@/types/api'

interface Props {
  proveedorId: string
  contactos: ContactoProveedor[]
}

type FormData = {
  nombre: string
  cargo: string
  email: string
  telefono: string
}

const empty: FormData = { nombre: '', cargo: '', email: '', telefono: '' }
const labelCn = 'mb-1.5 block text-sm font-medium'

function validate(form: FormData) {
  const errors: Partial<Record<keyof FormData, string>> = {}
  if (!form.nombre.trim()) errors.nombre = 'El nombre es requerido'
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = 'Email inválido'
  return errors
}

function ContactoForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial: FormData
  onSubmit: (data: FormData) => Promise<void>
  onCancel: () => void
  submitLabel: string
}) {
  const [form, setForm] = useState<FormData>(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next = validate(form)
    if (Object.keys(next).length) { setErrors(next); return }
    setLoading(true)
    setServerError(null)
    try {
      await onSubmit(form)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error inesperado')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCn}>
            Nombre <span className="text-destructive">*</span>
          </label>
          <Input
            value={form.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            placeholder="Ej. Juan Pérez"
            aria-invalid={!!errors.nombre}
          />
          {errors.nombre && (
            <p className="mt-1 text-xs text-destructive">{errors.nombre}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className={labelCn}>Cargo</label>
          <Input
            value={form.cargo}
            onChange={(e) => set('cargo', e.target.value)}
            placeholder="Ej. Gerente comercial"
          />
        </div>

        <div>
          <label className={labelCn}>Email</label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="juan@empresa.com"
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        <div>
          <label className={labelCn}>Teléfono</label>
          <Input
            value={form.telefono}
            onChange={(e) => set('telefono', e.target.value)}
            placeholder="912 345 678"
          />
        </div>
      </div>

      {serverError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="min-w-24">
          {loading ? 'Guardando...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

export function ContactosProveedorSection({ proveedorId, contactos }: Props) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ContactoProveedor | null>(null)
  const [settingPrincipal, setSettingPrincipal] = useState<string | null>(null)

  const tienePrincipal = contactos.some((c) => c.esPrincipal)

  async function handleCreate(form: FormData) {
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== ''),
    )
    await api.post(`/proveedores/${proveedorId}/contactos`, payload)
    setCreateOpen(false)
    router.refresh()
  }

  async function handleEdit(form: FormData) {
    if (!editTarget) return
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== ''),
    )
    await api.patch(`/proveedores/${proveedorId}/contactos/${editTarget.id}`, payload)
    setEditTarget(null)
    router.refresh()
  }

  async function handleSetPrincipal(contactoId: string) {
    setSettingPrincipal(contactoId)
    try {
      await api.patch(`/proveedores/${proveedorId}/contactos/${contactoId}/principal`, {})
      router.refresh()
    } finally {
      setSettingPrincipal(null)
    }
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-white p-5 space-y-1.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Contactos ({contactos.length})
          </h2>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3 mr-1" />
            Agregar
          </Button>
        </div>

        {!contactos.length ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
            <UserCircle2 className="size-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">Sin contactos registrados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {contactos.map((contacto) => (
              <div key={contacto.id} className="flex items-start justify-between py-3 border rounded-lg p-2">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {contacto.cargo && (
                      <p className="text-sm font-medium">{contacto.cargo}</p>
                    )}
                    {contacto.esPrincipal && (
                      <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-200">
                        <Star className="size-2.5 fill-amber-500 text-amber-500" />
                        Principal
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{contacto.nombre}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    {contacto.email && (
                      <a
                        href={`mailto:${contacto.email}`}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-[120ms]"
                      >
                        {contacto.email}
                      </a>
                    )}
                    {contacto.telefono && (
                      <span className="text-xs text-muted-foreground font-mono">{contacto.telefono}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0 ml-4">
                  <button
                    onClick={() => setEditTarget(contacto)}
                    className="text-xs text-muted-foreground underline-offset-2 hover:underline hover:text-foreground transition-colors duration-[120ms]"
                  >
                    Editar
                  </button>
                  {!tienePrincipal && (
                    <button
                      onClick={() => handleSetPrincipal(contacto.id)}
                      disabled={settingPrincipal === contacto.id}
                      className="text-xs text-amber-600 underline-offset-2 hover:underline transition-colors duration-[120ms] disabled:opacity-50"
                    >
                      {settingPrincipal === contacto.id ? 'Asignando…' : 'Asignar principal'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo contacto</DialogTitle>
          </DialogHeader>
          {createOpen && (
            <ContactoForm
              initial={empty}
              onSubmit={handleCreate}
              onCancel={() => setCreateOpen(false)}
              submitLabel="Crear contacto"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar contacto</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <ContactoForm
              initial={{
                nombre: editTarget.nombre,
                cargo: editTarget.cargo ?? '',
                email: editTarget.email ?? '',
                telefono: editTarget.telefono ?? '',
              }}
              onSubmit={handleEdit}
              onCancel={() => setEditTarget(null)}
              submitLabel="Guardar cambios"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
