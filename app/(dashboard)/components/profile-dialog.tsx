'use client'

import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth/session'
import { api } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeClosed } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Role, User } from '@/types/api'

const ROLE_LABELS: Record<Role, string> = {
  supervisor: 'Supervisor',
  supervisor_civil: 'Supervisor Civil',
  supervisor_electrico: 'Supervisor Eléctrico',
  pdr: 'PDR',
  ing_civil: 'Ing. Civil',
  ing_electrico: 'Ing. Eléctrico',
  jefe_sig: 'Jefe SIG',
  logistica: 'Logística',
  gerencia: 'Gerencia',
  administrador: 'TI',
}

const labelCn = 'mb-1.5 block text-sm font-medium'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: { name: string; email: string; correoContacto?: string | null; role?: Role }
}

export function ProfileDialog({ open, onOpenChange, user }: Props) {
  const [name, setName] = useState(user.name)
  const [correoContacto, setCorreoContacto] = useState(user.correoContacto ?? '')
  const [cargo, setCargo] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    api.get<User>('/users/me').then((me) => setCargo(me.cargo ?? null))
  }, [open])

  function handleOpenChange(next: boolean) {
    onOpenChange(next)
    if (!next) {
      setName(user.name)
      setCorreoContacto(user.correoContacto ?? '')
      setNewPassword('')
      setConfirmPassword('')
      setErrors({})
      setServerError(null)
      setSuccess(false)
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors: Record<string, string> = {}
    if (!name.trim()) nextErrors.name = 'El nombre es requerido'
    if (correoContacto.trim() && !/^\S+@\S+\.\S+$/.test(correoContacto.trim())) {
      nextErrors.correoContacto = 'Correo inválido'
    }

    const wantsPasswordChange = newPassword || confirmPassword
    if (wantsPasswordChange) {
      if (newPassword.length < 8) nextErrors.newPassword = 'Mínimo 8 caracteres'
      if (newPassword !== confirmPassword) nextErrors.confirmPassword = 'Las contraseñas no coinciden'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    setServerError(null)
    setSuccess(false)

    const normalizedCorreoContacto = correoContacto.trim() || null
    if (name.trim() !== user.name || normalizedCorreoContacto !== (user.correoContacto ?? null)) {
      const payload: Record<string, unknown> = {
        name: name.trim(),
        correoContacto: normalizedCorreoContacto,
      }
      const { error } = await authClient.updateUser(payload)
      if (error) {
        setLoading(false)
        setServerError('No se pudo actualizar la información.')
        return
      }
    }

    if (wantsPasswordChange) {
      try {
        await api.patch('/users/me/password', { newPassword })
      } catch {
        setLoading(false)
        setServerError('No se pudo cambiar la contraseña.')
        return
      }
    }

    setLoading(false)
    setSuccess(true)
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Mi perfil</DialogTitle>
          <DialogDescription>Actualiza tu información personal y tu contraseña.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
          {cargo && (
            <div>
              <label className={labelCn}>Cargo</label>
              <Input value={cargo} disabled className="text-muted-foreground" />
            </div>
          )}

          <div className={cargo ? undefined : 'sm:col-span-2'}>
            <label className={labelCn}>
              Nombre <span className="text-destructive">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
              }}
              aria-invalid={!!errors.name}
            />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
          </div>

          <ChangeEmailSection email={user.email} />

          <div className={user.role ? undefined : 'sm:col-span-2'}>
            <label className={labelCn}>Correo de contacto</label>
            <Input
              type="email"
              value={correoContacto}
              onChange={(e) => {
                setCorreoContacto(e.target.value)
                if (errors.correoContacto) setErrors((prev) => ({ ...prev, correoContacto: '' }))
              }}
              placeholder="tu.correo.personal@ejemplo.com"
              aria-invalid={!!errors.correoContacto}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Opcional. Además de tu correo corporativo, aquí también llegarán tus notificaciones.
            </p>
            {errors.correoContacto && (
              <p className="mt-1 text-xs text-destructive">{errors.correoContacto}</p>
            )}
          </div>

          {user.role && (
            <div>
              <label className={labelCn}>Rol</label>
              <Input value={ROLE_LABELS[user.role]} disabled className="text-muted-foreground" />
            </div>
          )}

          <div className="space-y-3 border-t border-border pt-4 sm:col-span-2">
            <p className="text-sm font-medium">Cambiar contraseña</p>

            <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              <div>
                <label className={labelCn}>Nueva contraseña</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value)
                      if (errors.newPassword) setErrors((prev) => ({ ...prev, newPassword: '' }))
                    }}
                    autoComplete="new-password"
                    aria-invalid={!!errors.newPassword}
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
                {errors.newPassword && <p className="mt-1 text-xs text-destructive">{errors.newPassword}</p>}
              </div>

              <div>
                <label className={labelCn}>Confirmar nueva contraseña</label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: '' }))
                  }}
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>

          {serverError && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive sm:col-span-2">
              {serverError}
            </p>
          )}
          {success && (
            <p className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary sm:col-span-2">
              Cambios guardados correctamente.
            </p>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-border pt-4 sm:col-span-2">
            <Button type="submit" disabled={loading} className="min-w-28">
              {loading ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ChangeEmailSection({ email }: { email: string }) {
  const [editing, setEditing] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  function toggle() {
    setEditing((v) => !v)
    setNewEmail('')
    setError(null)
    setSent(false)
  }

  async function handleSendConfirmation() {
    if (!newEmail.trim() || !/^\S+@\S+\.\S+$/.test(newEmail.trim())) {
      setError('Correo inválido')
      return
    }
    setLoading(true)
    setError(null)
    const { error: changeError } = await authClient.changeEmail({
      newEmail: newEmail.trim(),
      callbackURL: window.location.origin,
    })
    setLoading(false)
    if (changeError) {
      setError('No se pudo enviar el enlace de confirmación.')
      return
    }
    setSent(true)
  }

  return (
    <div className="sm:col-span-2">
      <label className={labelCn}>Correo corporativo</label>
      <Input value={email} disabled className="font-mono text-sm text-muted-foreground" />

      {!editing && (
        <button
          type="button"
          onClick={toggle}
          className="mt-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
        >
          ¿Necesitas cambiar tu correo?
        </button>
      )}

      {editing && (
        <div className="mt-2 space-y-2 rounded-lg border border-border p-3">
          {sent ? (
            <p className="text-xs text-muted-foreground">
              Enviamos un enlace de confirmación a <span className="font-medium text-foreground">{newEmail}</span>.
              Tu correo actual seguirá activo hasta que lo confirmes.
            </p>
          ) : (
            <>
              <label className="block text-xs font-medium">Nuevo correo</label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => {
                  setNewEmail(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="nuevo@empresa.cl"
                aria-invalid={!!error}
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={toggle}>
                  Cancelar
                </Button>
                <Button type="button" size="sm" disabled={loading} onClick={handleSendConfirmation}>
                  {loading ? 'Enviando…' : 'Enviar enlace de confirmación'}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
