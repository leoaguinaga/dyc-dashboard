import Link from 'next/link'
import { ChevronRight, Package } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { UNIDAD_ABBR } from '@/lib/inventario'
import type { ItemInventario } from '@/types/api'

const TIPO_LABELS = { consumible: 'Consumible', activo: 'Equipo' } as const
const TIPO_COLORS = {
  consumible: 'bg-muted text-muted-foreground',
  activo:     'bg-primary/10 text-primary',
} as const

export async function ItemsTable() {
  const result = await serverFetch<ItemInventario[]>('/inventario').catch(() => null)

  if (!result || result.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <Package className="size-10 text-muted-foreground/40" />
        <p className="mt-3 text-sm font-medium">Sin ítems registrados</p>
        <p className="mt-1 text-sm text-muted-foreground">Agrega el primer ítem al catálogo.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {['Código', 'Ítem', 'Tipo', 'Categoría', 'Unidad', 'Estado', ''].map((h) => (
              <th key={h} className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {result.map((i) => (
            <tr key={i.id} className="transition-colors duration-[120ms] hover:bg-muted/40">
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground tabular-nums">{i.codigo}</td>
              <td className="px-4 py-3 font-medium">{i.nombre}</td>
              <td className="px-4 py-3">
                <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', TIPO_COLORS[i.tipo])}>
                  {TIPO_LABELS[i.tipo]}
                </span>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{i.categoria ?? '—'}</td>
              <td className="px-4 py-3 text-muted-foreground">{UNIDAD_ABBR[i.unidad]}</td>
              <td className="px-4 py-3">
                <span className={cn(
                  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
                  i.activo ? 'bg-chart-2/15 text-chart-2' : 'bg-muted text-muted-foreground',
                )}>
                  {i.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/almacenes/items/${i.id}`}
                  className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
                >
                  <ChevronRight className="size-4" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
