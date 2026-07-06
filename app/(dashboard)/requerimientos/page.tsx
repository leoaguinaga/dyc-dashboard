import { Suspense } from 'react'
import { RequerimientosKpis } from './components/RequerimientosKpis'
import { RequerimientosKpisSkeleton } from './components/RequerimientosKpisSkeleton'
import { RequerimientosTable } from './components/RequerimientosTable'
import { RequerimientosTableSkeleton } from './components/RequerimientosTableSkeleton'

export default function RequerimientosPage() {
  return (
    <div className="space-y-3">
      <Suspense fallback={<RequerimientosKpisSkeleton />}>
        <RequerimientosKpis />
      </Suspense>
      <Suspense fallback={<RequerimientosTableSkeleton />}>
        <RequerimientosTable />
      </Suspense>
    </div>
  )
}
