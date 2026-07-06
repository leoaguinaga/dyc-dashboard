import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Package, Wrench } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { cn } from '@/lib/utils'
import { UNIDAD_LABELS } from '@/lib/inventario'
import type { ItemInventario } from '@/types/api'

interface Props {
  params: Promise<{ id: string }>
}

const TIPO_LABELS = { consumible: 'Consumible', activo: 'Equipo / Activo' } as const
const TIPO_COLORS = {
  consumible: 'bg-muted text-muted-foreground',
  activo: 'bg-primary/10 text-primary',
} as const

export default async function ItemDetailPage({ params }: Props) {
  const { id } = await params
  const result = await serverFetch<ItemInventario>(`/inventario/${id}`).catch((e: Error) => e)

  if (result instanceof Error) {
    if (result.message.includes('404')) notFound()
    return <p className="text-sm text-destructive">Error al cargar el ítem.</p>
  }

  const item = result
  const Icon = item.tipo === 'activo' ? Wrench : Package

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/almacenes/items"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver al catálogo
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Icon className="size-5 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{item.nombre}</h1>
              <p className="text-sm text-muted-foreground font-mono">{item.codigo}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', TIPO_COLORS[item.tipo])}>
              {TIPO_LABELS[item.tipo]}
            </span>
            <span className={cn(
              'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
              item.activo ? 'bg-chart-2/15 text-chart-2' : 'bg-muted text-muted-foreground',
            )}>
              {item.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-5 space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Detalle</h2>
        <dl className="grid gap-4 sm:grid-cols-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Unidad de medida</dt>
            <dd className="mt-0.5 font-medium">{UNIDAD_LABELS[item.unidad]}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Categoría</dt>
            <dd className="mt-0.5 font-medium">{item.categoria ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Descripción</dt>
            <dd className="mt-0.5 font-medium">{item.descripcion ?? '—'}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
