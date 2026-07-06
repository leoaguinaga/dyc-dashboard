import {
  Building2,
  ClipboardList,
  FileSpreadsheet,
  ShoppingCart,
  Wallet,
  Boxes,
} from 'lucide-react'
import { KpiCard } from '@/components/shared/KpiCard'
import {
  CotizacionesFunnelChart,
  FinanzasChart,
  InventarioTipoChart,
  OrdenesCompraMontoChart,
  ProyectosEstadoChart,
  RequerimientosTrendChart,
} from './components/DashboardCharts'

// Mock estático para validar layout de KPIs + charts. No consulta datos reales.

function Section({
  icon: Icon,
  title,
  badge,
  chart,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  badge?: string
  chart: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {badge && (
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-background p-4 lg:col-span-2">
          {chart}
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">{children}</div>
      </div>
    </section>
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <Section icon={Building2} title="Proyectos" chart={<ProyectosEstadoChart />}>
        <KpiCard label="Proyectos activos" value={14} context="8 ejecución · 4 planificación · 2 cierre" />
        <KpiCard
          label="Hitos próximos a vencer"
          value={5}
          delta={{ label: '+2', trend: 'down' }}
          context="Próximos 7 días"
        />
      </Section>

      <Section icon={ClipboardList} title="Requerimientos" chart={<RequerimientosTrendChart />}>
        <KpiCard label="Pendientes de aprobación" value={9} context="3 marcados urgentes" />
        <KpiCard
          label="Tiempo prom. de aprobación"
          value="1.8 días"
          delta={{ label: '-0.4', trend: 'up' }}
          context="Últimos 30 días"
        />
      </Section>

      <Section icon={FileSpreadsheet} title="Cotizaciones" chart={<CotizacionesFunnelChart />}>
        <KpiCard
          label="Estancadas +5 días"
          value={2}
          delta={{ label: 'atención', trend: 'down' }}
        />
        <KpiCard
          label="Ahorro por adjudicación"
          value="S/ 4,320"
          delta={{ label: '+6%', trend: 'up' }}
          context="Vs. precio promedio cotizado"
        />
      </Section>

      <Section icon={ShoppingCart} title="Órdenes de compra" chart={<OrdenesCompraMontoChart />}>
        <KpiCard label="Emitidas" value={11} context="No recibidas aún" />
        <KpiCard
          label="Entrega vencida"
          value={2}
          delta={{ label: 'riesgo', trend: 'down' }}
        />
      </Section>

      <Section icon={Wallet} title="Finanzas" badge="Gerencia y administración" chart={<FinanzasChart />}>
        <KpiCard
          label="Vencido"
          value="S/ 12,300"
          delta={{ label: '3 pagos', trend: 'down' }}
        />
        <KpiCard label="Próximos 7 días" value="S/ 28,900" context="5 pagos programados" />
      </Section>

      <Section icon={Boxes} title="Inventario" chart={<InventarioTipoChart />}>
        <KpiCard label="Ítems activos" value={186} context="142 consumibles · 44 activos" />
        <KpiCard label="Almacenes activos" value={6} context="4 fijos · 2 temporales" />
      </Section>
    </div>
  )
}
