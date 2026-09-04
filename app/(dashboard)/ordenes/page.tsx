import { Suspense } from 'react'
import { OrdenesCompraKpis } from '../ordenes-compra/components/OrdenesCompraKpis'
import { OrdenesCompraTable } from '../ordenes-compra/components/OrdenesCompraTable'

function KpisSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-xl border border-border bg-muted/40" />
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="h-8 w-full animate-pulse rounded-lg bg-muted/40" />
      <div className="overflow-hidden rounded-xl border border-border">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-12 animate-pulse border-b border-border bg-muted/20" />
        ))}
      </div>
    </div>
  )
}

export default function OrdenesPage() {
  return (
    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Órdenes C/S</h1>
        <p className="text-sm text-muted-foreground">
          Órdenes de compra y servicio en una sola vista operativa.
        </p>
      </div>
      {/*  <Suspense fallback={<KpisSkeleton />}>
        <OrdenesCompraKpis />
      </Suspense> */}
      <Suspense fallback={<TableSkeleton />}>
        <OrdenesCompraTable />
      </Suspense>
    </div>
  )
}
