import { Suspense } from 'react'
import { RequerimientosTable } from './components/RequerimientosTable'
import { RequerimientosTableSkeleton } from './components/RequerimientosTableSkeleton'

export default function RequerimientosPage() {
  return (
    <div className="space-y-">
      <Suspense fallback={<RequerimientosTableSkeleton />}>
        <RequerimientosTable />
      </Suspense>
    </div>
  )
}
