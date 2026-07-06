import { Suspense } from 'react'
import { UsuariosKpis } from './components/UsuariosKpis'
import { UsuariosKpisSkeleton } from './components/UsuariosKpisSkeleton'
import { UsuariosTable } from './components/UsuariosTable'
import { UsuariosTableSkeleton } from './components/UsuariosTableSkeleton'

export default function UsuariosPage() {
  return (
    <div className="space-y-3">
      <Suspense fallback={<UsuariosKpisSkeleton />}>
        <UsuariosKpis />
      </Suspense>
      <Suspense fallback={<UsuariosTableSkeleton />}>
        <UsuariosTable />
      </Suspense>
    </div>
  )
}
