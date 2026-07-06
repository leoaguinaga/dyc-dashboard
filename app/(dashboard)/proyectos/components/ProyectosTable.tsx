import Link from 'next/link'
import { Building2, Plus, ShieldAlert } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ProyectosTableClient } from './ProyectosTableClient'
import type { Proyecto } from '@/types/api'

export async function ProyectosTable() {
  const result = await serverFetch<Proyecto[]>('/proyectos').catch((e: Error) => e)

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
            : 'No se pudieron cargar los proyectos. Intenta de nuevo.'}
        </p>
      </div>
    )
  }

  if (result.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <Building2 className="size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">Sin proyectos registrados</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Crea el primer proyecto para comenzar
        </p>
        <Link href="/proyectos/nuevo" className={cn(buttonVariants(), 'mt-4')}>
          <Plus className="size-4" />
          Primer proyecto
        </Link>
      </div>
    )
  }

  return <ProyectosTableClient proyectos={result} />
}
