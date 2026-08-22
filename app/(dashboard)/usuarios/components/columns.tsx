'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header'
import type { Role, User } from '@/types/api'

export const ROLE_LABELS: Record<Role, string> = {
  administrador:        'Administrador',
  admin_ti:             'Admin TI',
  gerencia:             'Gerencia',
  logistica:            'Logística',
  supervisor:           'Supervisor',
  supervisor_civil:     'Supervisor Civil',
  supervisor_electrico: 'Supervisor Eléctrico',
  pdr:                  'PDR (Seguridad)',
  ing_civil:            'Ing. Civil',
  ing_electrico:        'Ing. Eléctrico',
  jefe_sig:             'Jefe SIG',
}

const ROLE_COLORS: Record<Role, string> = {
  administrador:        'bg-primary/10 text-primary',
  admin_ti:             'bg-violet-500/10 text-violet-600',
  gerencia:             'bg-chart-1/15 text-chart-1',
  logistica:            'bg-chart-2/15 text-chart-2',
  supervisor:           'bg-muted text-muted-foreground',
  supervisor_civil:     'bg-blue-500/10 text-blue-600',
  supervisor_electrico: 'bg-amber-500/10 text-amber-600',
  pdr:                  'bg-orange-500/10 text-orange-600',
  ing_civil:            'bg-blue-500/10 text-blue-600',
  ing_electrico:        'bg-amber-500/10 text-amber-600',
  jefe_sig:             'bg-orange-500/10 text-orange-600',
}

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
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
    header: () => null,
    enableSorting: false,
    cell: ({ row }) => (
      <Link
        href={`/usuarios/${row.original.id}/editar`}
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
      >
        <ChevronRight className="size-4" />
      </Link>
    ),
  },
]
