import { serverFetch } from '@/lib/api/server'
import { PlanillasGlobalView } from './components/PlanillasGlobalView'
import type { Proyecto } from '@/types/api'

export default async function PlanillaGlobalPage() {
  const proyectos = await serverFetch<Proyecto[]>('/proyectos').catch(() => [] as Proyecto[])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Planilla</h1>
        <p className="text-sm text-muted-foreground">
          Planillas de operarios generadas por obra y periodo.
        </p>
      </div>
      <PlanillasGlobalView proyectos={proyectos} />
    </div>
  )
}
