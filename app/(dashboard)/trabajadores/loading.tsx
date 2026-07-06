import { TrabajadoresKpisSkeleton } from './components/TrabajadoresKpisSkeleton'
import { TrabajadoresTableSkeleton } from './components/TrabajadoresTableSkeleton'

export default function TrabajadoresLoading() {
  return (
    <div className="space-y-6">
      {/* <TrabajadoresPageHeader /> */}
      <TrabajadoresKpisSkeleton />
      <TrabajadoresTableSkeleton />
    </div>
  )
}
