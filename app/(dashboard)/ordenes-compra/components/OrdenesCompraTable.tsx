import { serverFetch } from '@/lib/api/server'
import { ordenLabelPlural } from '@/lib/ordenes'
import type { OrdenCompra, TipoOrdenCompra } from '@/types/api'
import { OrdenesCompraTableClient } from './OrdenesCompraTableClient'

interface Props {
  tipo: TipoOrdenCompra
}

export async function OrdenesCompraTable({ tipo }: Props) {
  const ordenes = await serverFetch<OrdenCompra[]>(`/ordenes-compra?tipo=${tipo}`).catch(() => [] as OrdenCompra[])

  if (ordenes.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white py-16 text-center space-y-2">
        <p className="text-sm font-medium text-muted-foreground">No hay {ordenLabelPlural(tipo).toLowerCase()}</p>
        <p className="text-xs text-muted-foreground">Se generan desde solicitudes aprobadas por gerencia.</p>
      </div>
    )
  }

  return <OrdenesCompraTableClient ordenes={ordenes} tipo={tipo} />
}
