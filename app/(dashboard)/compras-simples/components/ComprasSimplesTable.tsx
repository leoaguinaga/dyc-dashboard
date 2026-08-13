import Link from 'next/link'
import { ShoppingBag, Plus } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ComprasSimplesTableClient } from './ComprasSimplesTableClient'
import type { CompraSimple, User } from '@/types/api'

// Debe coincidir con ROLES_CREACION en compras-simples.service.ts
const CON_ACCESO_CREACION = ['supervisor', 'supervisor_civil', 'supervisor_electrico', 'pdr', 'administrador']

export async function ComprasSimplesTable() {
  const [result, user] = await Promise.all([
    serverFetch<CompraSimple[]>('/compras-simples').catch((e: Error) => e),
    serverFetch<User>('/users/me').catch(() => null),
  ])
  const puedeCrear = !!user?.role && CON_ACCESO_CREACION.includes(user.role)

  if (result instanceof Error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <ShoppingBag className="size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">Error al cargar</p>
        <p className="mt-1 text-sm text-muted-foreground">No se pudieron cargar las compras simples.</p>
      </div>
    )
  }

  if (result.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <ShoppingBag className="size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">Sin compras simples</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Registra una compra ya cotizada o realizada en campo
        </p>
        {puedeCrear && (
          <Link href="/compras-simples/nueva" className={cn(buttonVariants(), 'mt-4')}>
            <Plus className="size-4" />
            Nueva compra simple
          </Link>
        )}
      </div>
    )
  }

  return <ComprasSimplesTableClient compras={result} />
}
