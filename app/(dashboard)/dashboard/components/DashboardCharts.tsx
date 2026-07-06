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

// Mock estático — solo para validar layout visual, sin datos reales aún.

const proyectosEstadoData = [
  { estado: 'Ejecución', value: 8, fill: 'var(--color-ejecucion)' },
  { estado: 'Planificación', value: 4, fill: 'var(--color-planificacion)' },
  { estado: 'Cierre', value: 2, fill: 'var(--color-cierre)' },
]

const proyectosEstadoConfig = {
  value: { label: 'Proyectos' },
  ejecucion: { label: 'Ejecución', color: 'var(--chart-1)' },
  planificacion: { label: 'Planificación', color: 'var(--chart-3)' },
  cierre: { label: 'Cierre', color: 'var(--chart-5)' },
} satisfies ChartConfig

export function ProyectosEstadoChart() {
  return (
    <ChartContainer config={proyectosEstadoConfig} className="mx-auto aspect-square max-h-[220px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="estado" hideLabel />} />
        <Pie data={proyectosEstadoData} dataKey="value" nameKey="estado" innerRadius={55} strokeWidth={4}>
          {proyectosEstadoData.map((entry) => (
            <Cell key={entry.estado} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="estado" />} />
      </PieChart>
    </ChartContainer>
  )
}

const requerimientosTrendData = [
  { semana: 'S1', creados: 9, aprobados: 6 },
  { semana: 'S2', creados: 11, aprobados: 8 },
  { semana: 'S3', creados: 7, aprobados: 7 },
  { semana: 'S4', creados: 14, aprobados: 9 },
  { semana: 'S5', creados: 10, aprobados: 10 },
  { semana: 'S6', creados: 12, aprobados: 8 },
  { semana: 'S7', creados: 8, aprobados: 6 },
  { semana: 'S8', creados: 12, aprobados: 11 },
]

const requerimientosTrendConfig = {
  creados: { label: 'Creados', color: 'var(--chart-1)' },
  aprobados: { label: 'Aprobados', color: 'var(--chart-2)' },
} satisfies ChartConfig

export function RequerimientosTrendChart() {
  return (
    <ChartContainer config={requerimientosTrendConfig} className="aspect-auto h-[220px] w-full">
      <AreaChart data={requerimientosTrendData} margin={{ left: 0, right: 12 }}>
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

const cotizacionesFunnelData = [
  { etapa: 'Borrador', value: 12 },
  { etapa: 'Enviada', value: 9 },
  { etapa: 'Cotizada', value: 7 },
  { etapa: 'Seleccionada', value: 5 },
  { etapa: 'Aprobada', value: 4 },
]

const cotizacionesFunnelConfig = {
  value: { label: 'Solicitudes', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function CotizacionesFunnelChart() {
  return (
    <ChartContainer config={cotizacionesFunnelConfig} className="aspect-auto h-[220px] w-full">
      <BarChart data={cotizacionesFunnelData} layout="vertical" margin={{ left: 8 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" hide />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}

const ordenesMontoData = [
  { mes: 'Feb', monto: 98000 },
  { mes: 'Mar', monto: 121000 },
  { mes: 'Abr', monto: 87000 },
  { mes: 'May', monto: 145000 },
  { mes: 'Jun', monto: 133000 },
  { mes: 'Jul', monto: 182400 },
]

const ordenesMontoConfig = {
  monto: { label: 'Monto emitido', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function OrdenesCompraMontoChart() {
  return (
    <ChartContainer config={ordenesMontoConfig} className="aspect-auto h-[220px] w-full">
      <BarChart data={ordenesMontoData} margin={{ left: 0, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="monto" fill="var(--color-monto)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}

const finanzasData = [
  { mes: 'Feb', pagado: 90000, pendiente: 20000, vencido: 4000 },
  { mes: 'Mar', pagado: 105000, pendiente: 18000, vencido: 6000 },
  { mes: 'Abr', pagado: 80000, pendiente: 24000, vencido: 9000 },
  { mes: 'May', pagado: 120000, pendiente: 30000, vencido: 5000 },
  { mes: 'Jun', pagado: 110000, pendiente: 27000, vencido: 8000 },
  { mes: 'Jul', pagado: 145600, pendiente: 96150, vencido: 12300 },
]

const finanzasConfig = {
  pagado: { label: 'Pagado', color: 'var(--chart-2)' },
  pendiente: { label: 'Pendiente', color: 'var(--chart-3)' },
  vencido: { label: 'Vencido', color: 'var(--chart-4)' },
} satisfies ChartConfig

export function FinanzasChart() {
  return (
    <ChartContainer config={finanzasConfig} className="aspect-auto h-[220px] w-full">
      <BarChart data={finanzasData} margin={{ left: 0, right: 12 }}>
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

const inventarioTipoData = [
  { tipo: 'Consumible', value: 142, fill: 'var(--color-consumible)' },
  { tipo: 'Activo', value: 44, fill: 'var(--color-activo)' },
]

const inventarioTipoConfig = {
  value: { label: 'Ítems' },
  consumible: { label: 'Consumible', color: 'var(--chart-1)' },
  activo: { label: 'Activo', color: 'var(--chart-5)' },
} satisfies ChartConfig

export function InventarioTipoChart() {
  return (
    <ChartContainer config={inventarioTipoConfig} className="mx-auto aspect-square max-h-[220px]">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="tipo" hideLabel />} />
        <Pie data={inventarioTipoData} dataKey="value" nameKey="tipo" innerRadius={55} strokeWidth={4}>
          {inventarioTipoData.map((entry) => (
            <Cell key={entry.tipo} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="tipo" />} />
      </PieChart>
    </ChartContainer>
  )
}
