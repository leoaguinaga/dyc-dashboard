import { serverFetch } from '@/lib/api/server'
import { ClipboardList } from 'lucide-react'
import type { OrdenCompra } from '@/types/api'
import { OrdenesCompraTableClient } from './OrdenesCompraTableClient'

export async function OrdenesCompraTable() {
  const result = await serverFetch<OrdenCompra[]>('/ordenes-compra').catch(
    (error: Error) => error,
  )

  if (result instanceof Error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <ClipboardList className="size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">No se pudieron cargar las órdenes</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Vuelve a intentarlo. Las órdenes de compra y servicio conservan sus datos y estados actuales.
        </p>
      </div>
    )
  }

  if (result.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white py-16 text-center space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Aún no hay órdenes</p>
        <p className="text-xs text-muted-foreground">Las órdenes de compra y servicio se generan desde solicitudes aprobadas por gerencia.</p>
      </div>
    )
  }

  return <OrdenesCompraTableClient ordenes={result} />
}
