import { serverFetch } from '@/lib/api/server'
import { formatCurrency } from '@/lib/utils'
import type { OrdenCompra } from '@/types/api'

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-white px-5 py-4 space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export async function OrdenesCompraKpis() {
  const ordenes = await serverFetch<OrdenCompra[]>('/ordenes-compra').catch(() => [] as OrdenCompra[])

  const emitidas = ordenes.filter((o) => o.estado === 'emitida').length
  const enTransito = ordenes.filter((o) => o.estado === 'recibida_parcial').length
  const recibidas = ordenes.filter((o) => o.estado === 'recibida').length
  const montoTotal = ordenes
    .filter((o) => o.estado !== 'cancelada')
    .reduce((sum, o) => sum + Number(o.montoTotal), 0)

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Total OC" value={ordenes.length} />
      <KpiCard label="Emitidas" value={emitidas} sub="Esperando recepción" />
      <KpiCard label="Recepción parcial" value={enTransito} />
      <KpiCard label="Monto comprometido" value={formatCurrency(montoTotal)} sub="Excluye canceladas" />
    </div>
  )
}
