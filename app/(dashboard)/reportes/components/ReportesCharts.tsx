'use client'

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import type {
  ReporteGastoPorProyecto,
  ReporteOcsPorProveedor,
  ReportePagosPorPeriodo,
} from '@/types/api'

const gastoPorProyectoConfig = {
  montoTotal: { label: 'Monto emitido', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function GastoPorProyectoChart({ data }: { data: ReporteGastoPorProyecto[] }) {
  const chartData = data.map((d) => ({ nombre: d.proyecto.codigo ?? d.proyecto.nombre, montoTotal: d.montoTotal }))
  return (
    <ChartContainer config={gastoPorProyectoConfig} className="aspect-auto h-[260px] w-full">
      <BarChart data={chartData} margin={{ left: 0, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="nombre" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="montoTotal" fill="var(--color-montoTotal)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}

const ocsPorProveedorConfig = {
  montoTotal: { label: 'Monto en OCs', color: 'var(--chart-2)' },
} satisfies ChartConfig

export function OcsPorProveedorChart({ data }: { data: ReporteOcsPorProveedor[] }) {
  const chartData = data.map((d) => ({ nombre: d.proveedor.razonSocial, montoTotal: d.montoTotal }))
  return (
    <ChartContainer config={ocsPorProveedorConfig} className="aspect-auto h-[260px] w-full">
      <BarChart data={chartData} layout="vertical" margin={{ left: 8 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" hide />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="montoTotal" fill="var(--color-montoTotal)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}

const pagosPorPeriodoConfig = {
  pagado: { label: 'Pagado', color: 'var(--chart-2)' },
  pendiente: { label: 'Pendiente', color: 'var(--chart-3)' },
  vencido: { label: 'Vencido', color: 'var(--chart-4)' },
} satisfies ChartConfig

export function PagosPorPeriodoChart({ data }: { data: ReportePagosPorPeriodo[] }) {
  return (
    <ChartContainer config={pagosPorPeriodoConfig} className="aspect-auto h-[260px] w-full">
      <BarChart data={data} margin={{ left: 0, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="periodo" tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="pagado" stackId="f" fill="var(--color-pagado)" radius={[0, 0, 4, 4]} />
        <Bar dataKey="pendiente" stackId="f" fill="var(--color-pendiente)" />
        <Bar dataKey="vencido" stackId="f" fill="var(--color-vencido)" radius={[4, 4, 0, 0]} />
        <ChartLegend content={<ChartLegendContent />} />
      </BarChart>
    </ChartContainer>
  )
}
