import { Suspense } from 'react'
import { PagosViewLoader } from './components/PagosViewLoader'

function TableSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="h-10 w-full animate-pulse rounded-lg bg-muted/40" />
      <div className="rounded-xl border border-border overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 border-b border-border bg-muted/20 animate-pulse" />
        ))}
      </div>
    </div>
  )
}

export default function PagosPage() {
  return (
    <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-[250ms] ease-out">
      <Suspense fallback={<TableSkeleton />}>
        <PagosViewLoader />
      </Suspense>
    </div>
  )
}
