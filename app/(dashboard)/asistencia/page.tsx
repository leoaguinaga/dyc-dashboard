import { serverFetch } from '@/lib/api/server'
import { AsistenciaHomeView } from './components/AsistenciaHomeView'
import type { Proyecto } from '@/types/api'

export default async function AsistenciaGlobalPage() {
  const proyectos = await serverFetch<Proyecto[]>('/proyectos').catch(() => [] as Proyecto[])

  return <AsistenciaHomeView proyectos={proyectos} />
}
