import Link from 'next/link'
import { Users, Plus, ShieldAlert } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TrabajadoresTableClient } from './TrabajadoresTableClient'
import type { Trabajador } from '@/types/api'

export async function TrabajadoresTable() {
  const result = await serverFetch<Trabajador[]>('/trabajadores').catch((e: Error) => e)

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
            : 'No se pudieron cargar los trabajadores. Intenta de nuevo.'}
        </p>
      </div>
    )
  }

  if (result.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <Users className="size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">Sin trabajadores registrados</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Agrega el primer trabajador para comenzar
        </p>
        <Link href="/trabajadores/nuevo" className={cn(buttonVariants(), 'mt-4')}>
          <Plus className="size-4" />
          Nuevo trabajador
        </Link>
      </div>
    )
  }

  return <TrabajadoresTableClient trabajadores={result} />
}
