'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, UserCheck, Loader2 } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSession } from '@/lib/auth/session'
import { cn } from '@/lib/utils'
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header'
import type { Role, User } from '@/types/api'

export const ROLE_LABELS: Record<Role, string> = {
  administrador: 'Administrador',
  admin_ti: 'Admin TI',
  gerencia: 'Gerencia',
  logistica: 'Logística',
  supervisor: 'Supervisor',
  supervisor_civil: 'Supervisor Civil',
  supervisor_electrico: 'Supervisor Eléctrico',
  pdr: 'PDR (Seguridad)',
  ing_civil: 'Ing. Civil',
  ing_electrico: 'Ing. Eléctrico',
  jefe_sig: 'Jefe SIG',
}

const ROLE_COLORS: Record<Role, string> = {
  administrador: 'bg-primary/10 text-primary',
  admin_ti: 'bg-violet-500/10 text-violet-600',
  gerencia: 'bg-chart-1/15 text-chart-1',
  logistica: 'bg-chart-2/15 text-chart-2',
  supervisor: 'bg-muted text-muted-foreground',
  supervisor_civil: 'bg-blue-500/10 text-blue-600',
  supervisor_electrico: 'bg-amber-500/10 text-amber-600',
  pdr: 'bg-orange-500/10 text-orange-600',
  ing_civil: 'bg-blue-500/10 text-blue-600',
  ing_electrico: 'bg-amber-500/10 text-amber-600',
  jefe_sig: 'bg-orange-500/10 text-orange-600',
}

function ImpersonateUserButton({ user }: { user: User }) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const isCurrentAdminTi = session?.user?.role === 'admin_ti'
  const isSelf = session?.user?.id === user.id

  if (!isCurrentAdminTi || isSelf) {
    return null
  }

  const handleImpersonate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/impersonate-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
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
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-7 px-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors gap-1.5"
        title={`Ingresar como ${user.name}`}
      >
        <UserCheck className="size-3.5" />
        <span className="hidden sm:inline">Ingresar</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Iniciar sesión como {user.name}</DialogTitle>
            <DialogDescription>
              Entrarás a la plataforma con el rol{' '}
              <strong className="text-foreground">{ROLE_LABELS[user.role] ?? user.role}</strong> para
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

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
    cell: ({ row }) => (
      <Link
        className="font-medium hover:underline underline-offset-4"
        href={`/usuarios/${row.original.id}/editar`}
      >
        {row.original.name}
      </Link>
    ),
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{row.original.email}</span>
    ),
  },
  {
    accessorKey: 'role',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Rol" />,
    cell: ({ row }) => {
      const role = row.original.role
      return (
        <span
          className={cn(
            'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
            ROLE_COLORS[role],
          )}
        >
          {ROLE_LABELS[role]}
        </span>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Desde" />,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground tabular-nums">
        {new Date(row.original.createdAt).toLocaleDateString('es-CL', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </span>
    ),
  },
  {
    id: 'actions',
    header: () => <span className="text-xs font-medium text-muted-foreground">Acción</span>,
    cell: ({ row }) => <ImpersonateUserButton user={row.original} />,
  },
]