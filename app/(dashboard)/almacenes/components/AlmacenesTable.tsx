import { ShieldAlert, Warehouse } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import type { Almacen } from '@/types/api'
import { AlmacenesTableClient } from './AlmacenesTableClient'

export async function AlmacenesTable() {
  const result = await serverFetch<Almacen[]>('/almacenes').catch((e: Error) => e)

  if (result instanceof Error) {
    const is403 = result.message.includes('403')
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <ShieldAlert className="size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">{is403 ? 'Sin permisos' : 'Error al cargar'}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {is403 ? 'No tienes acceso a este módulo.' : 'No se pudieron cargar los almacenes.'}
        </p>
      </div>
    )
  }

  if (result.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <Warehouse className="size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">Sin almacenes registrados</p>
      </div>
    )
  }

  return <AlmacenesTableClient initialAlmacenes={result} />
}

