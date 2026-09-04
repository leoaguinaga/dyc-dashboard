import { Suspense } from 'react'
import { ProyectosTable } from './components/ProyectosTable'
import { ProyectosTableSkeleton } from './components/ProyectosTableSkeleton'
import { ProyectosPageHeader } from './components/ProyectosPageHeader'
import { ProyectosPageHeaderSkeleton } from './components/ProyectosPageHeaderSkeleton'

export default function ProyectosPage() {
  return (
    <div className="space-y-4">
      <Suspense fallback={<ProyectosPageHeaderSkeleton />}>
        <ProyectosPageHeader />
      </Suspense>

      <Suspense fallback={<ProyectosTableSkeleton />}>
        <ProyectosTable />
      </Suspense>
    </div>
  )
}
