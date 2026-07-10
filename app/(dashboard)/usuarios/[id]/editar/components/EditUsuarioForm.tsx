'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Role, User } from '@/types/api'

const ROLES: { value: Role; label: string }[] = [
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'ing_civil', label: 'Ing. Civil' },
  { value: 'ing_electrico', label: 'Ing. Eléctrico' },
  { value: 'jefe_sig', label: 'Jefe SIG' },
  { value: 'logistica', label: 'Logística' },
  { value: 'gerencia', label: 'Gerencia' },
  { value: 'administrador', label: 'TI' },
]

const labelCn = 'mb-1.5 block text-sm font-medium'

interface Props {
  usuario: User
}

export function EditUsuarioForm({ usuario }: Props) {
  const router = useRouter()
  const [name, setName] = useState(usuario.name)
  const [role, setRole] = useState<Role>(usuario.role)
  const [nameError, setNameError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setNameError('El nombre es requerido')
      return
    }
    setNameError(null)
    setLoading(true)
    setServerError(null)
    try {
      await api.patch(`/users/${usuario.id}`, { name: name.trim(), role })
      router.push('/usuarios')
      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Error al guardar los cambios')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelCn}>
          Nombre <span className="text-destructive">*</span>
        </label>
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (nameError) setNameError(null)
          }}
          placeholder="Nombre completo"
          aria-invalid={!!nameError}
        />
        {nameError && <p className="mt-1 text-xs text-destructive">{nameError}</p>}
      </div>

      <div>
        <label className={labelCn}>Email</label>
        <Input value={usuario.email} disabled className="font-mono text-sm text-muted-foreground" />
        <p className="mt-1 text-xs text-muted-foreground">El email no puede modificarse desde aquí.</p>
      </div>

      <div>
        <label className={labelCn}>Rol</label>
        <Select value={role} onValueChange={(v) => setRole(v as Role)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {serverError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <a href="/usuarios" className={cn(buttonVariants({ variant: 'outline' }))}>
          Cancelar
        </a>
        <Button type="submit" disabled={loading} className="min-w-28">
          {loading ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}
