import { Suspense } from 'react'
import { TrabajadoresKpis } from './components/TrabajadoresKpis'
import { TrabajadoresKpisSkeleton } from './components/TrabajadoresKpisSkeleton'
import { TrabajadoresTable } from './components/TrabajadoresTable'
import { TrabajadoresTableSkeleton } from './components/TrabajadoresTableSkeleton'

export default function TrabajadoresPage() {
  return (
    <div className="space-y-3">
      <Suspense fallback={<TrabajadoresKpisSkeleton />}>
        <TrabajadoresKpis />
      </Suspense>
      <Suspense fallback={<TrabajadoresTableSkeleton />}>
        <TrabajadoresTable />
      </Suspense>
    </div>
  )
}
