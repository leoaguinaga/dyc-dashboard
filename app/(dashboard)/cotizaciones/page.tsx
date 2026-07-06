import { Suspense } from 'react'
import { CotizacionesKpis } from './components/CotizacionesKpis'
import { CotizacionesKpisSkeleton } from './components/CotizacionesKpisSkeleton'
import { CotizacionesTable } from './components/CotizacionesTable'
import { CotizacionesTableSkeleton } from './components/CotizacionesTableSkeleton'

export default function CotizacionesPage() {
  return (
    <div className="space-y-3">
      <Suspense fallback={<CotizacionesKpisSkeleton />}>
        <CotizacionesKpis />
      </Suspense>
      <Suspense fallback={<CotizacionesTableSkeleton />}>
        <CotizacionesTable />
      </Suspense>
    </div>
  )
}
