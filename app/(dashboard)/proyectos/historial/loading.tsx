import { ArrowLeft } from 'lucide-react'
import { ProyectosTableSkeleton } from '../components/ProyectosTableSkeleton'

export default function ProyectosHistorialLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <ArrowLeft className="size-3.5" />
          Volver a proyectos
        </div>
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="h-4 w-80 animate-pulse rounded bg-muted" />
      </div>

      <ProyectosTableSkeleton />
    </div>
  )
}
