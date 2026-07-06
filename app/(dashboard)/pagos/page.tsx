import { Suspense } from 'react'
import { PagosKpis } from './components/PagosKpis'
import { PagosTable } from './components/PagosTable'

function KpisSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 rounded-xl border border-border bg-muted/40 animate-pulse" />
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-12 border-b border-border bg-muted/20 animate-pulse" />
      ))}
    </div>
  )
}

export default function PagosPage() {
  return (
    <div className="space-y-3">
      <Suspense fallback={<KpisSkeleton />}>
        <PagosKpis />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <PagosTable />
      </Suspense>
    </div>
  )
}
