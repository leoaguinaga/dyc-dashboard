import { Suspense } from 'react'
import { NotificacionesTable } from './components/NotificacionesTable'
import { NotificacionesTableSkeleton } from './components/NotificacionesTableSkeleton'

export default function NotificacionesPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Notificaciones</h1>
      <Suspense fallback={<NotificacionesTableSkeleton />}>
        <NotificacionesTable />
      </Suspense>
    </div>
  )
}
