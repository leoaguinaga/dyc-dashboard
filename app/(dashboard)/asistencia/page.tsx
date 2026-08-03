import { serverFetch } from '@/lib/api/server'
import { AsistenciaHomeView } from './components/AsistenciaHomeView'
import type { Proyecto } from '@/types/api'

export default async function AsistenciaGlobalPage() {
  const proyectos = await serverFetch<Proyecto[]>('/proyectos').catch(() => [] as Proyecto[])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Asistencia</h1>
        <p className="text-sm text-muted-foreground">
          Jornadas de operarios por obra. Entra a una jornada para ver el detalle por trabajador y el control de acceso del día.
        </p>
      </div>
      <AsistenciaHomeView proyectos={proyectos} />
    </div>
  )
}
