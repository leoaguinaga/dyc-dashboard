import { Suspense } from 'react'
import { ClientesKpis } from './components/ClientesKpis'
import { ClientesKpisSkeleton } from './components/ClientesKpisSkeleton'
import { ClientesTable } from './components/ClientesTable'
import { ClientesTableSkeleton } from './components/ClientesTableSkeleton'

export default function ClientesPage() {
  return (
    <div className="space-y-3">
      <Suspense fallback={<ClientesKpisSkeleton />}>
        <ClientesKpis />
      </Suspense>
      <Suspense fallback={<ClientesTableSkeleton />}>
        <ClientesTable />
      </Suspense>
    </div>
  )
}
