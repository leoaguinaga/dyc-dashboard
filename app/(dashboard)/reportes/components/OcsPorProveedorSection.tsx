import { serverFetch } from '@/lib/api/server'
import { KpiCard } from '@/components/shared/KpiCard'
import type { ReporteOcsPorProveedor } from '@/types/api'
import { OcsPorProveedorChart } from './ReportesCharts'
import { fmtMoney } from './fmt'

export async function OcsPorProveedorSection() {
  const data = await serverFetch<ReporteOcsPorProveedor[]>('/reportes/ocs-por-proveedor').catch(() => [])
  const montoTotal = data.reduce((s, d) => s + d.montoTotal, 0)
  const totalOcs = data.reduce((s, d) => s + d.totalOcs, 0)

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold tracking-tight text-foreground">OCs por proveedor</h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4">
            <p className="text-sm font-medium text-foreground">Monto en OCs por proveedor</p>
            <p className="text-xs text-muted-foreground">Todas las órdenes de compra registradas</p>
          </div>
          <OcsPorProveedorChart data={data} />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <KpiCard label="Gasto total en OCs" value={fmtMoney(montoTotal)} />
          <KpiCard label="Proveedores con OCs" value={data.length} context={`${totalOcs} órdenes de compra`} />
        </div>
      </div>
    </section>
  )
}
