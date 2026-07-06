import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { ItemsKpis } from './components/ItemsKpis'
import { ItemsKpisSkeleton } from './components/ItemsKpisSkeleton'
import { ItemsTable } from './components/ItemsTable'
import { ItemsTableSkeleton } from './components/ItemsTableSkeleton'

export default function ItemsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link
            href="/almacenes"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Volver a almacenes
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Catálogo de ítems</h1>
          <p className="text-sm text-muted-foreground">Consumibles y equipos disponibles en el sistema</p>
        </div>
        <Link href="/almacenes/items/nuevo" className={buttonVariants()}>
          <Plus className="size-4" />
          Nuevo ítem
        </Link>
      </div>

      <Suspense fallback={<ItemsKpisSkeleton />}>
        <ItemsKpis />
      </Suspense>

      <Suspense fallback={<ItemsTableSkeleton />}>
        <ItemsTable />
      </Suspense>
    </div>
  )
}
