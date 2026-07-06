import { serverFetch } from '@/lib/api/server'
import { KpiCard } from '@/components/shared/KpiCard'
import type { DashboardFinanzas } from '@/types/api'
import { ChartPanel, GroupHeader } from './DashboardLayout'
import { FinanzasChart } from './DashboardCharts'

function fmtMoney(n: number) {
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`
}

export async function DashboardFinanzasSection() {
  // Restringido a gerencia/administrador en el backend — para otros roles el
  // fetch responde 403 y la sección simplemente no se muestra.
  const data = await serverFetch<DashboardFinanzas>('/dashboard/finanzas').catch(() => null)
  if (!data) return null

  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-muted/30 p-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
      <GroupHeader
        title="Finanzas"
        description="pagos generados a partir de órdenes de compra"
        badge="Gerencia y administración"
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <ChartPanel title="Pagado, pendiente y vencido" description="Últimos 6 meses, por monto" span="lg:col-span-8">
          <FinanzasChart data={data.montoPorMes} />
        </ChartPanel>
        <div className="grid grid-cols-2 gap-3 lg:col-span-4 lg:grid-cols-1">
          <KpiCard
            label="Vencido"
            value={fmtMoney(data.totalVencido)}
            delta={data.totalVencido > 0 ? { label: 'atención', trend: 'down' } : undefined}
          />
          <KpiCard label="Próximos 7 días" value={fmtMoney(data.proximos7dias)} context="pagos programados" />
          <KpiCard label="Pagado este mes" value={fmtMoney(data.pagadoMes)} />
        </div>
      </div>
    </section>
  )
}
