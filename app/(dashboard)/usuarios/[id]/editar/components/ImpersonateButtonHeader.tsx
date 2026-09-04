'use client'

import { useState } from 'react'
import { UserCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSession } from '@/lib/auth/session'
import { ROLE_LABELS } from '../../../components/columns'
import type { User } from '@/types/api'

interface Props {
  targetUser: User
}

export function ImpersonateButtonHeader({ targetUser }: Props) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const isCurrentAdminTi = session?.user?.role === 'admin_ti'
  const isSelf = session?.user?.id === targetUser.id

  if (!isCurrentAdminTi || isSelf) {
    return null
  }

  const handleImpersonate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/impersonate-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUser.id }),
      })
      if (res.ok) {
        window.location.href = '/dashboard'
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.message ?? 'Error al iniciar sesión como este usuario.')
        setLoading(false)
      }
    } catch {
      alert('Error de conexión al iniciar sesión de soporte.')
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 text-xs text-muted-foreground hover:text-primary hover:border-primary/50"
      >
        <UserCheck className="size-3.5" />
        Ingresar como este usuario
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Iniciar sesión como {targetUser.name}</DialogTitle>
            <DialogDescription>
              Entrarás a la plataforma con el rol{' '}
              <strong className="text-foreground">{ROLE_LABELS[targetUser.role] ?? targetUser.role}</strong> para
              verificar su interfaz y permisos operativos. Podrás volver a tu cuenta de Administración TI en cualquier momento.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleImpersonate}
              disabled={loading}
              className="gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Ingresando...
                </>
              ) : (
                <>
                  <UserCheck className="size-3.5" />
                  Ingresar como usuario
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
