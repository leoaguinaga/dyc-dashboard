import { CotizacionesKpisSkeleton } from './components/CotizacionesKpisSkeleton'
import { CotizacionesTableSkeleton } from './components/CotizacionesTableSkeleton'

export default function CotizacionesLoading() {
  return (
    <div className="space-y-6">
      <CotizacionesKpisSkeleton />
      <CotizacionesTableSkeleton />
    </div>
  )
}
