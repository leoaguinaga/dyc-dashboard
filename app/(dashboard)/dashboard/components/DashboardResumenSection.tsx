import { serverFetch } from '@/lib/api/server'
import { KpiCard } from '@/components/shared/KpiCard'
import type { DashboardResumen } from '@/types/api'
import { ChartPanel, GroupHeader } from './DashboardLayout'
import {
  CotizacionesFunnelChart,
  InventarioTipoChart,
  OrdenesCompraMontoChart,
  ProyectosEstadoChart,
  RequerimientosTrendChart,
} from './DashboardCharts'

function fmtMoney(n: number) {
  return `S/ ${n.toLocaleString('es-PE', { minimumFractionDigits: 0 })}`
}

export async function DashboardResumenSection() {
  const data = await serverFetch<DashboardResumen>('/dashboard/resumen').catch(() => null)
  if (!data) return null

  const proyectosActivos = data.proyectos.porEstado.ejecucion + data.proyectos.porEstado.planificacion
  const emitidoEsteMes = data.ordenesCompra.montoPorMes.at(-1)?.monto ?? 0

  return (
    <div className="space-y-10 animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
      {/* Pulso del negocio: un número por dominio, para ver todo conectado de un vistazo */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="Proyectos activos"
          value={proyectosActivos}
          context={`${data.proyectos.porEstado.ejecucion} en ejecución`}
        />
        <KpiCard
          label="Requerimientos"
          value={data.requerimientos.pendientesAprobacion}
          context="pendientes de aprobar"
        />
        <KpiCard label="Cotizaciones" value={data.cotizaciones.solicitudesEnCurso} context="solicitudes en curso" />
        <KpiCard label="Emitido este mes" value={fmtMoney(emitidoEsteMes)} context="en órdenes de compra" />
        <KpiCard label="Ítems en inventario" value={data.inventario.itemsActivos} context="activos" />
      </div>

      {/* Obra: un proyecto genera requerimientos de material */}
      <section className="space-y-4">
        <GroupHeader title="Obra" description="proyectos y los requerimientos que generan" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <ChartPanel
            title="Proyectos por estado"
            description="Distribución de obras activas según su fase"
            span="lg:col-span-4"
          >
            <ProyectosEstadoChart porEstado={data.proyectos.porEstado} />
          </ChartPanel>
          <ChartPanel
            title="Requerimientos: creados vs. aprobados"
            description="Últimas 8 semanas"
            span="lg:col-span-8"
          >
            <RequerimientosTrendChart data={data.requerimientos.tendenciaSemanal} />
          </ChartPanel>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            label="Hitos próximos a vencer"
            value={data.proyectos.hitosProximos7dias}
            context="Próximos 7 días"
          />
          <KpiCard
            label="Hitos incumplidos"
            value={data.proyectos.hitosIncumplidos}
            delta={data.proyectos.hitosIncumplidos > 0 ? { label: 'riesgo', trend: 'down' } : undefined}
          />
          <KpiCard
            label="Requerimientos urgentes"
            value={data.requerimientos.urgentesPendientes}
            context={`dentro de los ${data.requerimientos.pendientesAprobacion} pendientes`}
          />
          <KpiCard
            label="Tiempo prom. de aprobación"
            value={
              data.requerimientos.tiempoPromedioAprobacionDias != null
                ? `${data.requerimientos.tiempoPromedioAprobacionDias} días`
                : '—'
            }
          />
        </div>
      </section>

      {/* Compras: un requerimiento se cotiza y termina en una orden de compra */}
      <section className="space-y-4">
        <GroupHeader title="Compras" description="del requerimiento cotizado a la orden emitida" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <ChartPanel
            title="Embudo de solicitudes"
            description="Cantidad de solicitudes por etapa del flujo"
            span="lg:col-span-5"
          >
            <CotizacionesFunnelChart data={data.cotizaciones.funnelPorEstado} />
          </ChartPanel>
          <ChartPanel
            title="Monto emitido en órdenes de compra"
            description="Últimos 6 meses"
            span="lg:col-span-7"
          >
            <OrdenesCompraMontoChart data={data.ordenesCompra.montoPorMes} />
          </ChartPanel>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            label="Solicitudes estancadas"
            value={data.cotizaciones.estancadasMas5Dias}
            delta={data.cotizaciones.estancadasMas5Dias > 0 ? { label: '+5 días', trend: 'down' } : undefined}
          />
          <KpiCard
            label="Ahorro por adjudicación"
            value={fmtMoney(data.cotizaciones.ahorroAdjudicacion)}
            context="Vs. precio promedio"
          />
          <KpiCard label="OCs emitidas" value={data.ordenesCompra.emitidasNoRecibidas} context="no recibidas aún" />
          <KpiCard
            label="Entrega vencida"
            value={data.ordenesCompra.entregaVencida}
            delta={data.ordenesCompra.entregaVencida > 0 ? { label: 'riesgo', trend: 'down' } : undefined}
          />
        </div>
      </section>

      {/* Inventario: recurso que soporta los requerimientos de obra */}
      <section className="space-y-4">
        <GroupHeader title="Inventario" description="ítems y almacenes disponibles para obra" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <ChartPanel title="Ítems por tipo" description="Consumible vs. activo" span="lg:col-span-4">
            <InventarioTipoChart itemsPorTipo={data.inventario.itemsPorTipo} />
          </ChartPanel>
          <div className="grid grid-cols-2 gap-3 lg:col-span-8 lg:grid-cols-2">
            <KpiCard
              label="Ítems activos"
              value={data.inventario.itemsActivos}
              context={`${data.inventario.itemsPorTipo.consumible} consumibles · ${data.inventario.itemsPorTipo.activo} activos`}
            />
            <KpiCard
              label="Almacenes activos"
              value={data.inventario.almacenesActivos}
              context={`${data.inventario.almacenesPorTipo.fijo} fijos · ${data.inventario.almacenesPorTipo.temporal} temporales`}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
