import { serverFetch } from '@/lib/api/server'
import type { OrdenCompra } from '@/types/api'
import { OrdenesCompraTableClient } from './OrdenesCompraTableClient'

export async function OrdenesCompraTable() {
  const ordenes = await serverFetch<OrdenCompra[]>('/ordenes-compra').catch(() => [] as OrdenCompra[])

  if (ordenes.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white py-16 text-center space-y-2">
        <p className="text-sm font-medium text-muted-foreground">No hay órdenes de compra</p>
        <p className="text-xs text-muted-foreground">Las OC se generan desde solicitudes aprobadas por gerencia.</p>
      </div>
    )
  }

  return <OrdenesCompraTableClient ordenes={ordenes} />
}
