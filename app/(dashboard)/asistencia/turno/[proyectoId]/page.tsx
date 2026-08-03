import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { AsistenciaTurnoView } from '@/components/asistencia/AsistenciaTurnoView'
import { hoyLimaISO } from '@/lib/date/fecha-lima'
import type { Proyecto, Turno, TurnoDetalle } from '@/types/api'

interface Props {
  params: Promise<{ proyectoId: string }>
}

export default async function AsistenciaTurnoPage({ params }: Props) {
  const { proyectoId } = await params

  const [proyecto, turnos] = await Promise.all([
    serverFetch<Proyecto>(`/proyectos/${proyectoId}`).catch(() => null),
    serverFetch<Turno[]>(`/asistencias/proyectos/${proyectoId}/turnos`).catch(() => [] as Turno[]),
  ])
  if (!proyecto) notFound()

  const turnoHoy = turnos.find((t) => t.fecha.slice(0, 10) === hoyLimaISO())
  const turnoDetalle = turnoHoy
    ? await serverFetch<TurnoDetalle>(`/asistencias/proyectos/${proyectoId}/turnos/${turnoHoy.id}`).catch(() => null)
    : null

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link
          href="/asistencia"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver a Asistencia
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Turno de asistencia — {proyecto.nombre}</h1>
        <p className="text-sm text-muted-foreground capitalize">
          {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Lima' })}
        </p>
      </div>

      <AsistenciaTurnoView proyecto={proyecto} turnoInicial={turnoDetalle} />
    </div>
  )
}
