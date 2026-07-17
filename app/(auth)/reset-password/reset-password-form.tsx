'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/session'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, EyeClosed } from 'lucide-react'

interface Props {
  token?: string
  invalidToken?: boolean
}

export function ResetPasswordForm({ token, invalidToken }: Props) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (!token || invalidToken) {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        Este enlace no es válido o ya expiró. Solicita uno nuevo desde la pantalla de inicio de sesión.
      </p>
    )
  }

  if (done) {
    return (
      <p className="text-sm text-muted-foreground">
        Tu contraseña se actualizó correctamente. Ya puedes{' '}
        <a href="/login" className="font-medium text-foreground underline underline-offset-2">
          iniciar sesión
        </a>
        .
      </p>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors: typeof errors = {}
    if (password.length < 8) nextErrors.password = 'Mínimo 8 caracteres'
    if (password !== confirmPassword) nextErrors.confirmPassword = 'Las contraseñas no coinciden'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    setServerError(null)
    const { error } = await authClient.resetPassword({ newPassword: password, token })
    setLoading(false)
    if (error) {
      setServerError('No se pudo restablecer la contraseña. El enlace puede haber expirado.')
      return
    }
    setDone(true)
    setTimeout(() => router.push('/login'), 2500)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium">Nueva contraseña</label>
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
            }}
            autoComplete="new-password"
            aria-invalid={!!errors.password}
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
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Confirmar contraseña</label>
        <Input
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value)
            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
          }}
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
        />
        {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <Button type="submit" className="w-full h-10.5" disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
      </Button>
    </form>
  )
}
