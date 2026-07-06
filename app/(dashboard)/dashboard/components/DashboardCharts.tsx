'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
} from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type { DashboardFinanzas, DashboardResumen } from '@/types/api'

const proyectosEstadoConfig = {
  value: { label: 'Proyectos' },
  ejecucion: { label: 'Ejecución', color: 'var(--chart-1)' },
  planificacion: { label: 'Planificación', color: 'var(--chart-3)' },
  cierre: { label: 'Cierre', color: 'var(--chart-5)' },
  liquidada: { label: 'Liquidada', color: 'var(--chart-2)' },
} satisfies ChartConfig

export function ProyectosEstadoChart({ porEstado }: { porEstado: DashboardResumen['proyectos']['porEstado'] }) {
  const data = [
    { estado: 'Ejecución', key: 'ejecucion', value: porEstado.ejecucion, fill: 'var(--color-ejecucion)' },
    { estado: 'Planificación', key: 'planificacion', value: porEstado.planificacion, fill: 'var(--color-planificacion)' },
    { estado: 'Cierre', key: 'cierre', value: porEstado.cierre, fill: 'var(--color-cierre)' },
    { estado: 'Liquidada', key: 'liquidada', value: porEstado.liquidada, fill: 'var(--color-liquidada)' },
  ].filter((d) => d.value > 0)

  return (
    <ChartContainer config={proyectosEstadoConfig} className="mx-auto aspect-square max-h-[220px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="estado" hideLabel />} />
        <Pie data={data} dataKey="value" nameKey="estado" innerRadius={55} strokeWidth={4}>
          {data.map((entry) => (
            <Cell key={entry.estado} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="estado" />} />
      </PieChart>
    </ChartContainer>
  )
}

const requerimientosTrendConfig = {
  creados: { label: 'Creados', color: 'var(--chart-1)' },
  aprobados: { label: 'Aprobados', color: 'var(--chart-2)' },
} satisfies ChartConfig

export function RequerimientosTrendChart({ data }: { data: DashboardResumen['requerimientos']['tendenciaSemanal'] }) {
  return (
    <ChartContainer config={requerimientosTrendConfig} className="aspect-auto h-[220px] w-full">
      <AreaChart data={data} margin={{ left: 0, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="semana" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <defs>
          <linearGradient id="fillCreados" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-creados)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="var(--color-creados)" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="fillAprobados" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-aprobados)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="var(--color-aprobados)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <Area dataKey="aprobados" type="monotone" fill="url(#fillAprobados)" stroke="var(--color-aprobados)" stackId="a" />
        <Area dataKey="creados" type="monotone" fill="url(#fillCreados)" stroke="var(--color-creados)" stackId="b" />
        <ChartLegend content={<ChartLegendContent />} />
      </AreaChart>
    </ChartContainer>
  )
}

const cotizacionesFunnelConfig = {
  value: { label: 'Solicitudes', color: 'var(--chart-1)' },
} satisfies ChartConfig

const ETAPA_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  cotizada: 'Cotizada',
  seleccionada: 'Seleccionada',
  aprobada: 'Aprobada',
}

export function CotizacionesFunnelChart({ data }: { data: DashboardResumen['cotizaciones']['funnelPorEstado'] }) {
  const chartData = data.map((d) => ({ ...d, etapa: ETAPA_LABEL[d.etapa] ?? d.etapa }))
  return (
    <ChartContainer config={cotizacionesFunnelConfig} className="aspect-auto h-[220px] w-full">
      <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" hide />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}

const ordenesMontoConfig = {
  monto: { label: 'Monto emitido', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function OrdenesCompraMontoChart({ data }: { data: DashboardResumen['ordenesCompra']['montoPorMes'] }) {
  return (
    <ChartContainer config={ordenesMontoConfig} className="aspect-auto h-[220px] w-full">
      <BarChart data={data} margin={{ left: 0, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="monto" fill="var(--color-monto)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}

const finanzasConfig = {
  pagado: { label: 'Pagado', color: 'var(--chart-2)' },
  pendiente: { label: 'Pendiente', color: 'var(--chart-3)' },
  vencido: { label: 'Vencido', color: 'var(--chart-4)' },
} satisfies ChartConfig

export function FinanzasChart({ data }: { data: DashboardFinanzas['montoPorMes'] }) {
  return (
    <ChartContainer config={finanzasConfig} className="aspect-auto h-[220px] w-full">
      <BarChart data={data} margin={{ left: 0, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="pagado" stackId="f" fill="var(--color-pagado)" radius={[0, 0, 4, 4]} />
        <Bar dataKey="pendiente" stackId="f" fill="var(--color-pendiente)" />
        <Bar dataKey="vencido" stackId="f" fill="var(--color-vencido)" radius={[4, 4, 0, 0]} />
        <ChartLegend content={<ChartLegendContent />} />
      </BarChart>
    </ChartContainer>
  )
}

const inventarioTipoConfig = {
  value: { label: 'Ítems' },
  consumible: { label: 'Consumible', color: 'var(--chart-1)' },
  activo: { label: 'Activo', color: 'var(--chart-5)' },
} satisfies ChartConfig

export function InventarioTipoChart({ itemsPorTipo }: { itemsPorTipo: DashboardResumen['inventario']['itemsPorTipo'] }) {
  const data = [
    { tipo: 'Consumible', value: itemsPorTipo.consumible, fill: 'var(--color-consumible)' },
    { tipo: 'Activo', value: itemsPorTipo.activo, fill: 'var(--color-activo)' },
  ].filter((d) => d.value > 0)

  return (
    <ChartContainer config={inventarioTipoConfig} className="mx-auto aspect-square max-h-[220px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="tipo" hideLabel />} />
        <Pie data={data} dataKey="value" nameKey="tipo" innerRadius={55} strokeWidth={4}>
          {data.map((entry) => (
            <Cell key={entry.tipo} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="tipo" />} />
      </PieChart>
    </ChartContainer>
  )
}
