import { RegistroHeader } from '@/components/registro/RegistroHeader'
import { serverFetch } from '@/lib/api/server'
import { CreateRequerimientoForm } from './components/CreateRequerimientoForm'
import type { Proyecto } from '@/types/api'

export default async function NuevoRequerimientoPage() {
  const proyectos = await serverFetch<Proyecto[]>('/proyectos?todos=1').catch(() => [] as Proyecto[])

  return (
    <div className="space-y-4">
      <RegistroHeader backHref="/solicitudes" backLabel="Volver a solicitudes" title="Nuevo requerimiento" estado="Borrador" />

      <CreateRequerimientoForm proyectos={proyectos} />
    </div>
  )
}
