import { Suspense } from 'react'
import { DashboardResumenSection } from './components/DashboardResumenSection'
import { DashboardFinanzasSection } from './components/DashboardFinanzasSection'

function ResumenSkeleton() {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-border bg-muted/40 animate-pulse" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="h-5 w-40 rounded-md bg-muted/40 animate-pulse" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="h-64 rounded-xl border border-border bg-muted/40 animate-pulse lg:col-span-5" />
            <div className="h-64 rounded-xl border border-border bg-muted/40 animate-pulse lg:col-span-7" />
          </div>
        </div>
      ))}
    </div>
  )
}

function FinanzasSkeleton() {
  return (
    <div className="h-72 rounded-2xl border border-border/60 bg-muted/30 animate-pulse" />
  )
}

export default function DashboardPage() {
  return (
    <div className="space-y-3">
      <Suspense fallback={<ResumenSkeleton />}>
        <DashboardResumenSection />
      </Suspense>

      <Suspense fallback={<FinanzasSkeleton />}>
        <DashboardFinanzasSection />
      </Suspense>
    </div>
  )
}
