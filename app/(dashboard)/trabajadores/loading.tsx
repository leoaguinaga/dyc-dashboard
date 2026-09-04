import { TrabajadoresPageHeader } from './components/TrabajadoresPageHeader'
import { TrabajadoresTableSkeleton } from './components/TrabajadoresTableSkeleton'

export default function TrabajadoresLoading() {
  return (
    <div className="space-y-3">
      <TrabajadoresPageHeader />
      <TrabajadoresTableSkeleton />
    </div>
  )
}

