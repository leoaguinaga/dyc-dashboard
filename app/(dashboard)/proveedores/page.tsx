import { Suspense } from 'react'
import { ProveedoresKpis } from './components/ProveedoresKpis'
import { ProveedoresKpisSkeleton } from './components/ProveedoresKpisSkeleton'
import { ProveedoresTable } from './components/ProveedoresTable'
import { ProveedoresTableSkeleton } from './components/ProveedoresTableSkeleton'

export default function ProveedoresPage() {
  return (
    <div className="space-y-3">
      <Suspense fallback={<ProveedoresKpisSkeleton />}>
        <ProveedoresKpis />
      </Suspense>
      <Suspense fallback={<ProveedoresTableSkeleton />}>
        <ProveedoresTable />
      </Suspense>
    </div>
  )
}
