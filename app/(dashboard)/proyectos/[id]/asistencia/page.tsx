import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { serverFetch } from '@/lib/api/server'
import { AsistenciaTurnoView } from '@/components/asistencia/AsistenciaTurnoView'
import { RegistroVisitaSection } from './components/RegistroVisitaSection'
import { VisitaTerceroSection } from './components/VisitaTerceroSection'
import { ConsolidadoAsistenciaSection } from './components/ConsolidadoAsistenciaSection'
import { Tabs, TabsList, TabsTab, TabsIndicator, TabsPanel } from '@/components/ui/tabs'
import { hoyLimaISO } from '@/lib/date/fecha-lima'
import type { Proyecto, RegistroVisita, Trabajador, Turno, TurnoDetalle, VisitaTercero } from '@/types/api'

interface Props {
  params: Promise<{ id: string }>
}

const CARGOS_OPERARIO = ['Operario', 'Técnico']

export default async function AsistenciaPage({ params }: Props) {
  const { id } = await params

  const [proyecto, turnos, registrosVisita, visitasTercero, trabajadores] = await Promise.all([
    serverFetch<Proyecto>(`/proyectos/${id}`).catch(() => null),
    serverFetch<Turno[]>(`/asistencias/proyectos/${id}/turnos`).catch(() => [] as Turno[]),
    serverFetch<RegistroVisita[]>(`/asistencias/proyectos/${id}/visitas`).catch(() => [] as RegistroVisita[]),
    serverFetch<VisitaTercero[]>(`/asistencias/proyectos/${id}/terceros`).catch(() => [] as VisitaTercero[]),
    serverFetch<Trabajador[]>('/trabajadores').catch(() => [] as Trabajador[]),
  ])
  if (!proyecto) notFound()

  const turnoHoy = turnos.find((t) => t.fecha.slice(0, 10) === hoyLimaISO())
  const turnoDetalle = turnoHoy
    ? await serverFetch<TurnoDetalle>(`/asistencias/proyectos/${id}/turnos/${turnoHoy.id}`).catch(() => null)
    : null

  const asignadosNoOperarios = (proyecto.trabajadores ?? [])
    .filter((pt) => !pt.fechaSalida)
    .map((pt) => pt.trabajador)
    .filter((t): t is Trabajador => !!t && !CARGOS_OPERARIO.includes(t.cargo ?? ''))

  const staffRegistros = registrosVisita.filter((r) => r.tipo === 'staff')
  const staffOficinaRegistros = registrosVisita.filter((r) => r.tipo === 'staff_oficina')

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <Link
          href={`/proyectos/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Volver al proyecto
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight">Asistencia y control de acceso — {proyecto.nombre}</h1>
        <p className="text-sm text-muted-foreground capitalize">
          {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Lima' })}
        </p>
      </div>

      <Tabs defaultValue="operarios">
        <TabsList>
          <TabsIndicator />
          <TabsTab value="operarios">Operarios</TabsTab>
          <TabsTab value="staff">Staff</TabsTab>
          <TabsTab value="staff_oficina">Staff oficina</TabsTab>
          <TabsTab value="terceros">Terceros</TabsTab>
          <TabsTab value="consolidado">Consolidado</TabsTab>
        </TabsList>

        <TabsPanel value="operarios">
          <AsistenciaTurnoView proyecto={proyecto} turnoInicial={turnoDetalle} />
        </TabsPanel>

        <TabsPanel value="staff">
          <RegistroVisitaSection
            proyectoId={id}
            tipo="staff"
            registros={staffRegistros}
            trabajadoresDisponibles={asignadosNoOperarios}
          />
        </TabsPanel>

        <TabsPanel value="staff_oficina">
          <RegistroVisitaSection
            proyectoId={id}
            tipo="staff_oficina"
            registros={staffOficinaRegistros}
            trabajadoresDisponibles={trabajadores}
          />
        </TabsPanel>

        <TabsPanel value="terceros">
          <VisitaTerceroSection proyectoId={id} visitas={visitasTercero} />
        </TabsPanel>

        <TabsPanel value="consolidado">
          <ConsolidadoAsistenciaSection proyectoId={id} />
        </TabsPanel>
      </Tabs>
    </div>
  )
}
