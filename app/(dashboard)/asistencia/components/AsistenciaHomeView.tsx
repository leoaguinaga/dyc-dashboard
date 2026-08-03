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
    return <MisProyectosPdrView proyectos={proyectos} />
  }

  return <JornadasGlobalView proyectos={proyectos} />
}
