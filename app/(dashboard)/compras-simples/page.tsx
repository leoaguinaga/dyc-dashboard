import { Suspense } from 'react'
import { ComprasSimplesTable } from './components/ComprasSimplesTable'
import { ComprasSimplesTableSkeleton } from './components/ComprasSimplesTableSkeleton'

export default function ComprasSimplesPage() {
  return (
    <div className="space-y-3">
      <Suspense fallback={<ComprasSimplesTableSkeleton />}>
        <ComprasSimplesTable />
      </Suspense>
    </div>
  )
}
