'use client'

import { useSession } from '@/lib/auth/session'
import { JornadasGlobalView } from './JornadasGlobalView'
import { MisProyectosPdrView } from './MisProyectosPdrView'
import type { Proyecto } from '@/types/api'

interface Props {
  proyectos: Proyecto[]
}

export function AsistenciaHomeView({ proyectos }: Props) {
  const { data: session } = useSession()
  const role = session?.user?.role

  if (role === 'pdr') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Obras donde eres prevencionista. Abre el turno de hoy o continúa el registro de asistencia.
        </p>
        <MisProyectosPdrView proyectos={proyectos} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <JornadasGlobalView proyectos={proyectos} />
    </div>
  )
}
