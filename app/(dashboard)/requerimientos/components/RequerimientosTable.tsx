import Link from 'next/link'
import { ClipboardList, Plus } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { RequerimientosTableClient } from './RequerimientosTableClient'
import type { Requerimiento } from '@/types/api'

export async function RequerimientosTable() {
  const result = await serverFetch<Requerimiento[]>('/requerimientos').catch((e: Error) => e)

  if (result instanceof Error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <ClipboardList className="size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">Error al cargar</p>
        <p className="mt-1 text-sm text-muted-foreground">No se pudieron cargar los requerimientos.</p>
      </div>
    )
  }

  if (result.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <ClipboardList className="size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">Sin requerimientos</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Crea el primer requerimiento de materiales
        </p>
        <Link href="/requerimientos/nuevo" className={cn(buttonVariants(), 'mt-4')}>
          <Plus className="size-4" />
          Nuevo requerimiento
        </Link>
      </div>
    )
  }

  return <RequerimientosTableClient requerimientos={result} />
}
