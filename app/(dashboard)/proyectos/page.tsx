import { Suspense } from 'react'
import { ProyectosKpis } from './components/ProyectosKpis'
import { ProyectosKpisSkeleton } from './components/ProyectosKpisSkeleton'
import { ProyectosTable } from './components/ProyectosTable'
import { ProyectosTableSkeleton } from './components/ProyectosTableSkeleton'

export default function ProyectosPage() {
  return (
    <div className="space-y-3">
      <Suspense fallback={<ProyectosKpisSkeleton />}>
        <ProyectosKpis />
      </Suspense>
      <Suspense fallback={<ProyectosTableSkeleton />}>
        <ProyectosTable />
      </Suspense>
    </div>
  )
}
