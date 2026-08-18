import { serverFetch } from '@/lib/api/server'
import type { Cobro } from '@/types/api'
import { CobrosView } from './CobrosView'

export async function CobrosViewLoader() {
  const cobros = await serverFetch<Cobro[]>('/cobros').catch(() => [] as Cobro[])

  if (cobros.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white py-16 text-center space-y-2">
        <p className="text-sm font-medium text-muted-foreground">No hay cobros registrados</p>
        <p className="text-xs text-muted-foreground">Los cobros se generan automáticamente al cerrar una obra (Liquidación).</p>
      </div>
    )
  }

  return <CobrosView cobros={cobros} />
}
