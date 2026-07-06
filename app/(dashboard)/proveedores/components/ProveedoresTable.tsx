import Link from 'next/link'
import { Truck, Plus, ShieldAlert } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ProveedoresTableClient } from './ProveedoresTableClient'
import type { Proveedor } from '@/types/api'

export async function ProveedoresTable() {
  const result = await serverFetch<Proveedor[]>('/proveedores').catch((e: Error) => e)

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
            : 'No se pudieron cargar los proveedores. Intenta de nuevo.'}
        </p>
      </div>
    )
  }

  if (result.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <Truck className="size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">Sin proveedores registrados</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Agrega el primer proveedor para comenzar
        </p>
        <Link href="/proveedores/nuevo" className={cn(buttonVariants(), 'mt-4')}>
          <Plus className="size-4" />
          Nuevo proveedor
        </Link>
      </div>
    )
  }

  return <ProveedoresTableClient proveedores={result} />
}
