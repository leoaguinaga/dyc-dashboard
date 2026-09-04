import { Suspense } from 'react'
import { UsuariosPageHeader } from './components/UsuariosPageHeader'
import { UsuariosTable } from './components/UsuariosTable'
import { UsuariosTableSkeleton } from './components/UsuariosTableSkeleton'

export default function UsuariosPage() {
  return (
    <div className="space-y-3">
      <UsuariosPageHeader />
      <Suspense fallback={<UsuariosTableSkeleton />}>
        <UsuariosTable />
      </Suspense>
    </div>
  )
}

