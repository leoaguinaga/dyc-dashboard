import Link from 'next/link'
import { Building, Plus, ShieldAlert } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ClientesTableClient } from './ClientesTableClient'
import type { Cliente } from '@/types/api'

export async function ClientesTable() {
  const result = await serverFetch<Cliente[]>('/clientes').catch((e: Error) => e)

  if (result instanceof Error) {
    const is403 = result.message.includes('403')
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <ShieldAlert className="size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">
          {is403 ? 'Sin permisos' : 'Error al cargar'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {is403
            ? 'No tienes acceso a este módulo. Contacta al administrador.'
            : 'No se pudieron cargar los clientes. Intenta de nuevo.'}
        </p>
      </div>
    )
  }

  if (result.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <Building className="size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">Sin clientes registrados</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Registra el primer cliente para comenzar
        </p>
        <Link href="/clientes/nuevo" className={cn(buttonVariants(), 'mt-4')}>
          <Plus className="size-4" />
          Primer cliente
        </Link>
      </div>
    )
  }

  return <ClientesTableClient clientes={result} />
}
