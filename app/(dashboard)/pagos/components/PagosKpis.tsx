import { serverFetch } from '@/lib/api/server'
import type { ResumenPagos } from '@/types/api'

function KpiCard({ label, value, sub, alert }: { label: string; value: string; sub?: string; alert?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-white px-5 py-4 space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={alert ? 'text-2xl font-bold tabular-nums text-destructive' : 'text-2xl font-bold tabular-nums'}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function fmtMoney(n: number) {
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`
}

export async function PagosKpis() {
  const resumen = await serverFetch<ResumenPagos>('/pagos/resumen').catch(
    () => ({ totalPendiente: 0, totalVencido: 0, proximos7dias: 0, pagadoMes: 0 }),
  )

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Pendiente total" value={fmtMoney(resumen.totalPendiente)} />
      <KpiCard label="Vencido" value={fmtMoney(resumen.totalVencido)} alert={resumen.totalVencido > 0} sub="Requiere atención" />
      <KpiCard label="Próximos 7 días" value={fmtMoney(resumen.proximos7dias)} />
      <KpiCard label="Pagado este mes" value={fmtMoney(resumen.pagadoMes)} />
    </div>
  )
}
