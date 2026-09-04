import { Suspense } from 'react'
import { ClientesPageHeader } from './components/ClientesPageHeader'
import { ClientesTable } from './components/ClientesTable'
import { ClientesTableSkeleton } from './components/ClientesTableSkeleton'

export default function ClientesPage() {
  return (
    <div className="space-y-3">
      <ClientesPageHeader />
      <Suspense fallback={<ClientesTableSkeleton />}>
        <ClientesTable />
      </Suspense>
    </div>
  )
}

