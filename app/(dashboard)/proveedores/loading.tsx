import { ProveedoresKpisSkeleton } from './components/ProveedoresKpisSkeleton'
import { ProveedoresTableSkeleton } from './components/ProveedoresTableSkeleton'

export default function ProveedoresLoading() {
  return (
    <div className="space-y-6">
      {/* <ProveedoresPageHeader /> */}
      <ProveedoresKpisSkeleton />
      <ProveedoresTableSkeleton />
    </div>
  )
}
