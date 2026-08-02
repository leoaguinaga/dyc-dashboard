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
import type { ResultadoReporte } from '@/lib/reportes/tipos'

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

export function ResultadosChart({ resultado }: { resultado: ResultadoReporte }) {
  const [categoria, ...resto] = resultado.columnas
  if (!categoria) return null

  const numericCols = resto.filter((c) => c.tipo === 'number')
  if (numericCols.length === 0 || resultado.filas.length === 0) return null

  const config = Object.fromEntries(
    numericCols.map((c, i) => [c.key, { label: c.label, color: COLORS[i % COLORS.length] }]),
  ) as ChartConfig

  const data = resultado.filas.map((fila) => ({
    ...fila,
    [categoria.key]: String(fila[categoria.key] ?? '—'),
  }))

  return (
    <ChartContainer config={config} className="aspect-auto h-[280px] w-full">
      <BarChart data={data} margin={{ left: 0, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey={categoria.key} tickLine={false} axisLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {numericCols.map((c) => (
          <Bar key={c.key} dataKey={c.key} fill={`var(--color-${c.key})`} radius={4} />
        ))}
        {numericCols.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
      </BarChart>
    </ChartContainer>
  )
}
