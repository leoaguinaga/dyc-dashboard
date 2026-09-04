import { serverFetch } from '@/lib/api/server'
import { AsistenciaHomeView } from './components/AsistenciaHomeView'
import type { Proyecto } from '@/types/api'
import { UserPlus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AsistenciaGlobalPage() {
  const proyectos = await serverFetch<Proyecto[]>('/proyectos').catch(() => [] as Proyecto[])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Asistencias</h1>
          <p className="text-sm text-muted-foreground">
            Jornadas de operarios por obra. Entra a una jornada para ver el detalle por trabajador y el control de acceso del día.
          </p>
        </div>
        <Link href="/asistencia/nuevo">
          <Button>
            <UserPlus className='size-4' />
            Marcar asistencia
          </Button>
        </Link>
      </div>
      <AsistenciaHomeView proyectos={proyectos} />
    </div>
  )
}
