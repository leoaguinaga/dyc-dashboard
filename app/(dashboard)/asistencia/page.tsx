import { serverFetch } from '@/lib/api/server'
import { AsistenciaHomeView } from './components/AsistenciaHomeView'
import type { Proyecto } from '@/types/api'

export default async function AsistenciaGlobalPage() {
  const proyectos = await serverFetch<Proyecto[]>('/proyectos').catch(() => [] as Proyecto[])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Asistencia</h1>
      </div>
      <AsistenciaHomeView proyectos={proyectos} />
    </div>
  )
}
