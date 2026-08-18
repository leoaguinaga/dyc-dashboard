import { Suspense } from 'react'
import { CobrosKpis } from './components/CobrosKpis'
import { CobrosViewLoader } from './components/CobrosViewLoader'

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

export default function CobrosPage() {
  return (
    <div className="space-y-3">
      <Suspense fallback={<KpisSkeleton />}>
        <CobrosKpis />
      </Suspense>
      <Suspense fallback={<TableSkeleton />}>
        <CobrosViewLoader />
      </Suspense>
    </div>
  )
}
