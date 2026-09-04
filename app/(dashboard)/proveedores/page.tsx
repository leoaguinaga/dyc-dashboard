import { Suspense } from 'react'
import { ProveedoresTable } from './components/ProveedoresTable'
import { ProveedoresTableSkeleton } from './components/ProveedoresTableSkeleton'
import { ProveedoresPageHeader } from './components/ProveedoresPageHeader'

export default function ProveedoresPage() {
  return (
    <div className="space-y-4">
      <ProveedoresPageHeader />
      <Suspense fallback={<ProveedoresTableSkeleton />}>
        <ProveedoresTable />
      </Suspense>
    </div>
  )
}
