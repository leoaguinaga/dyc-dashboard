import { ProyectosKpisSkeleton } from './components/ProyectosKpisSkeleton'
import { ProyectosTableSkeleton } from './components/ProyectosTableSkeleton'

export default function ProyectosLoading() {
  return (
    <div className="space-y-6">
      <ProyectosKpisSkeleton />
      <ProyectosTableSkeleton />
    </div>
  )
}
