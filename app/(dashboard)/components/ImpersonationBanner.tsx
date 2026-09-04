'use client'

import { useState } from 'react'
import { ShieldAlert, LogOut, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROLE_LABELS } from '../usuarios/components/columns'
import type { Role } from '@/types/api'

export interface ImpersonationInfo {
  adminId: string
  adminName: string
  targetId: string
  targetName: string
  targetRole: Role
}

interface Props {
  info: ImpersonationInfo
}

export function ImpersonationBanner({ info }: Props) {
  const [loading, setLoading] = useState(false)

  const handleStop = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/stop-impersonating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (res.ok) {
        window.location.href = '/usuarios'
      } else {
        alert('Error al volver a la sesión de administración. Intenta recargar la página.')
        setLoading(false)
      }
    } catch {
      alert('Error de conexión al restaurar sesión.')
      setLoading(false)
    }
  }

  const roleLabel = ROLE_LABELS[info.targetRole] ?? info.targetRole

  return (
    <div className="w-full bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shrink-0 z-40 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <ShieldAlert className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="truncate">
          <span className="font-semibold">Modo soporte TI:</span> Estás navegando como{' '}
          <strong className="font-bold underline decoration-amber-500/50">{info.targetName}</strong>{' '}
          <span className="opacity-80">({roleLabel})</span>
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleStop}
        disabled={loading}
        className="h-7 px-2.5 text-xs bg-card/80 hover:bg-card border-amber-500/40 text-foreground shrink-0 gap-1.5 shadow-none"
      >
        {loading ? (
          <>
            <Loader2 className="size-3 animate-spin" />
            Restaurando...
          </>
        ) : (
          <>
            <LogOut className="size-3 text-muted-foreground" />
            Volver a Admin TI
          </>
        )}
      </Button>
    </div>
  )
}
