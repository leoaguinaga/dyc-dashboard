import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ProyectosTable } from '../components/ProyectosTable'
import { ProyectosTableSkeleton } from '../components/ProyectosTableSkeleton'

export default function ProyectosHistorialPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Link
          href="/proyectos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a proyectos
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Historial de proyectos</h1>
        <p className="text-sm text-muted-foreground">
          Historial y registro de todos los proyectos.
        </p>
      </div>

      <Suspense fallback={<ProyectosTableSkeleton />}>
        <ProyectosTable />
      </Suspense>
    </div>
  )
}
