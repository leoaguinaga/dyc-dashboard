import { serverFetch } from '@/lib/api/server'
import { KpiCard } from '@/components/shared/KpiCard'
import type { ReportePagosPorPeriodo } from '@/types/api'
import { PagosPorPeriodoChart } from './ReportesCharts'
import { fmtMoney } from './fmt'

export async function PagosPorPeriodoSection() {
  const data = await serverFetch<ReportePagosPorPeriodo[]>('/reportes/pagos-por-periodo').catch(() => [])
  const totalPagado = data.reduce((s, d) => s + d.pagado, 0)
  const totalVencido = data.reduce((s, d) => s + d.vencido, 0)

  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-4">
      <h2 className="text-base font-semibold tracking-tight text-foreground">Pagos por periodo</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4">
            <p className="text-sm font-medium text-foreground">Pagado, pendiente y vencido por mes</p>
            <p className="text-xs text-muted-foreground">Agrupado por mes de fecha programada</p>
          </div>
          <PagosPorPeriodoChart data={data} />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <KpiCard label="Pagado (histórico)" value={fmtMoney(totalPagado)} />
          <KpiCard label="Vencido (histórico)" value={fmtMoney(totalVencido)} />
        </div>
      </div>
    </section>
  )
}
