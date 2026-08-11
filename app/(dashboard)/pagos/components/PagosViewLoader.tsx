import { serverFetch } from '@/lib/api/server'
import type { Pago } from '@/types/api'
import { PagosView } from './PagosView'

export async function PagosViewLoader() {
  const pagos = await serverFetch<Pago[]>('/pagos').catch(() => [] as Pago[])

  if (pagos.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white py-16 text-center space-y-2">
        <p className="text-sm font-medium text-muted-foreground">No hay pagos registrados</p>
        <p className="text-xs text-muted-foreground">Los pagos se programan desde el detalle de cada orden de compra.</p>
      </div>
    )
  }

  return <PagosView pagos={pagos} />
}
