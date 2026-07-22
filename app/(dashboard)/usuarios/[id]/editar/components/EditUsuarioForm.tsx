'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/client'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Eye, EyeClosed } from 'lucide-react'
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
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    let hasError = false
    if (!name.trim()) {
      setNameError('El nombre es requerido')
      hasError = true
    } else {
      setNameError(null)
    }

    const wantsPasswordChange = newPassword || confirmPassword
    if (wantsPasswordChange) {
      if (newPassword.length < 8) {
        setPasswordError('Mínimo 8 caracteres')
        hasError = true
      } else {
        setPasswordError(null)
      }
      if (newPassword !== confirmPassword) {
        setConfirmPasswordError('Las contraseñas no coinciden')
        hasError = true
      } else {
        setConfirmPasswordError(null)
      }
    } else {
      setPasswordError(null)
      setConfirmPasswordError(null)
    }

    if (hasError) return

    setLoading(true)
    setServerError(null)
    try {
      await api.patch(`/users/${usuario.id}`, { name: name.trim(), role })
      if (wantsPasswordChange) {
        await api.patch(`/users/${usuario.id}/password`, { newPassword })
      }
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

      <div className="space-y-3 border-t border-border pt-4">
        <p className="text-sm font-medium">Cambiar contraseña</p>
        <p className="text-xs text-muted-foreground">
          Opcional. Déjalo en blanco si no necesitas restablecer la contraseña de este usuario.
        </p>

        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
          <div>
            <label className={labelCn}>Nueva contraseña</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  if (passwordError) setPasswordError(null)
                }}
                autoComplete="new-password"
                aria-invalid={!!passwordError}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeClosed className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordError && <p className="mt-1 text-xs text-destructive">{passwordError}</p>}
          </div>

          <div>
            <label className={labelCn}>Confirmar nueva contraseña</label>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (confirmPasswordError) setConfirmPasswordError(null)
              }}
              autoComplete="new-password"
              aria-invalid={!!confirmPasswordError}
            />
            {confirmPasswordError && (
              <p className="mt-1 text-xs text-destructive">{confirmPasswordError}</p>
            )}
          </div>
        </div>
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
