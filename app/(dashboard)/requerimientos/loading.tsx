import { RequerimientosKpisSkeleton } from './components/RequerimientosKpisSkeleton'
import { RequerimientosTableSkeleton } from './components/RequerimientosTableSkeleton'

export default function RequerimientosLoading() {
  return (
    <div className="space-y-6">
      <RequerimientosKpisSkeleton />
      <RequerimientosTableSkeleton />
    </div>
  )
}
