import { Suspense } from 'react'
import { TrabajadoresPageHeader } from './components/TrabajadoresPageHeader'
import { TrabajadoresTable } from './components/TrabajadoresTable'
import { TrabajadoresTableSkeleton } from './components/TrabajadoresTableSkeleton'

export default function TrabajadoresPage() {
  return (
    <div className="space-y-3">
      <TrabajadoresPageHeader />
      <Suspense fallback={<TrabajadoresTableSkeleton />}>
        <TrabajadoresTable />
      </Suspense>
    </div>
  )
}

