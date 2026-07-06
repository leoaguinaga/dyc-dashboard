import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Building2, Warehouse } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { cn } from '@/lib/utils'
import type { Almacen } from '@/types/api'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AlmacenDetailPage({ params }: Props) {
  const { id } = await params
  const result = await serverFetch<Almacen>(`/almacenes/${id}`).catch((e: Error) => e)

  if (result instanceof Error) {
    if (result.message.includes('404')) notFound()
    return <p className="text-sm text-destructive">Error al cargar el almacén.</p>
  }

  const a = result
  const Icon = a.tipo === 'fijo' ? Building2 : Warehouse

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/almacenes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a almacenes
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Icon className="size-5 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{a.nombre}</h1>
              <p className="text-sm text-muted-foreground">
                {a.tipo === 'fijo' ? `Fijo · ${a.ciudad ?? 'Sin ciudad'}` : `Temporal · ${a.ciudad ?? 'Sin ciudad'}`}
              </p>
            </div>
          </div>
          <span className={cn(
            'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
            a.activo ? 'bg-chart-2/15 text-chart-2' : 'bg-muted text-muted-foreground',
          )}>
            {a.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {a.notas && (
        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Notas</h2>
          <p className="text-sm whitespace-pre-wrap">{a.notas}</p>
        </div>
      )}

      {!a.notas && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <Warehouse className="size-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm font-medium">Sin notas</p>
          <p className="mt-1 text-sm text-muted-foreground">Edita el almacén para agregar notas sobre su contenido.</p>
        </div>
      )}
    </div>
  )
}
