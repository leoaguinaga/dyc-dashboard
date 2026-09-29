'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ClipboardCheckIcon, FileTextIcon } from 'lucide-react'
import { api } from '@/lib/api/client'
import { useSession } from '@/lib/auth/session'
import { hoyLimaISO } from '@/lib/date/fecha-lima'
import { Button, buttonVariants } from '@/components/ui/button'
import { TabBoton } from '@/components/ui/tab-boton'
import { HoyPorObra } from './HoyPorObra'
import { MarcarAsistenciaDialog } from './MarcarAsistenciaDialog'
import { useObrasHoy } from './obra-hoy'
import { JornadasGlobalView, diasAtras, formatFecha, puedeVerJornadas, type FiltroEstado } from './JornadasGlobalView'
import type { Proyecto } from '@/types/api'

interface Props {
  proyectos: Proyecto[]
}

type Tab = 'hoy' | 'historial'

interface Pendientes {
  sinCerrar: number
  masAntigua: string | null
  porRevisar: number
}

export function AsistenciaHomeView({ proyectos }: Props) {
  const { data: session } = useSession()
  const role = session?.user?.role
  const verHistorial = puedeVerJornadas(role)

  const [tab, setTab] = useState<Tab>('hoy')
  const [estado, setEstado] = useState<FiltroEstado>('todas')
  const [marcando, setMarcando] = useState(false)
  const [pendientes, setPendientes] = useState<Pendientes>({ sinCerrar: 0, masAntigua: null, porRevisar: 0 })
  const obrasHoy = useObrasHoy()

  useEffect(() => {
    if (!verHistorial) return
    let cancelado = false
    // El aviso es secundario: si falla, la pantalla sigue funcionando sin él.
    api.get<Pendientes>('/asistencias/jornadas-pendientes')
      .then((data) => { if (!cancelado) setPendientes(data) })
      .catch(() => {})
    return () => {
      cancelado = true
    }
  }, [verHistorial])

  function verHistorialFiltrado(filtro: FiltroEstado) {
    setEstado(filtro)
    setTab('historial')
  }

  const porAtender = pendientes.sinCerrar + pendientes.porRevisar

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Asistencia</h1>
          <p className="text-sm text-muted-foreground">
            {verHistorial
              ? 'Abre o continúa el turno de hoy en cada obra y revisa el historial de jornadas.'
              : 'Obras donde eres prevencionista. Abre el turno de hoy o continúa el registro de asistencia.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {verHistorial && (
            <Link href="/asistencia/desde-hoja" className={buttonVariants({ variant: 'outline' })}>
              <FileTextIcon className="size-4" aria-hidden />
              Registrar desde hoja
            </Link>
          )}
          <Button onClick={() => setMarcando(true)}>
            <ClipboardCheckIcon className="size-4" aria-hidden />
            Marcar asistencia
          </Button>
        </div>
      </div>

      <MarcarAsistenciaDialog open={marcando} onOpenChange={setMarcando} data={obrasHoy.data} loading={obrasHoy.loading} error={obrasHoy.error} />

      {verHistorial && (
        <div role="tablist" aria-label="Secciones de asistencia" className="flex gap-1 border-b border-border">
          <TabBoton id="tab-hoy" controls="panel-hoy" activo={tab === 'hoy'} onClick={() => setTab('hoy')}>
            Hoy
          </TabBoton>
          <TabBoton id="tab-historial" controls="panel-historial" activo={tab === 'historial'} onClick={() => setTab('historial')}>
            Historial
            {porAtender > 0 && (
              <span className="rounded-md bg-amber-500/15 px-1.5 font-mono text-xs text-amber-800" aria-label={`${porAtender} por atender`}>
                {porAtender}
              </span>
            )}
          </TabBoton>
        </div>
      )}

      <div id="panel-hoy" role={verHistorial ? 'tabpanel' : undefined} aria-labelledby={verHistorial ? 'tab-hoy' : undefined} hidden={tab !== 'hoy'} className="space-y-4 pt-1">
        {verHistorial && pendientes.sinCerrar > 0 && pendientes.masAntigua && (
          <AvisoPendiente
            texto={pendientes.sinCerrar === 1 ? '1 jornada de un día anterior sigue abierta.' : `${pendientes.sinCerrar} jornadas de días anteriores siguen abiertas.`}
            detalle={`La más antigua es del ${formatFecha(pendientes.masAntigua).slice(0, 5)}, hace ${diasAtras(pendientes.masAntigua, hoyLimaISO())} días. El sistema las cierra solo al pasar 4 horas de la hora fin del horario.`}
            accion="Ver jornadas sin cerrar"
            onClick={() => verHistorialFiltrado('sin_cerrar')}
          />
        )}
        {verHistorial && pendientes.porRevisar > 0 && (
          <AvisoPendiente
            texto={pendientes.porRevisar === 1 ? '1 jornada la cerró el sistema y falta revisarla.' : `${pendientes.porRevisar} jornadas las cerró el sistema y falta revisarlas.`}
            detalle="Decide si se pagan las horas extra que se contaron hasta el cierre."
            accion="Revisar cierres automáticos"
            onClick={() => verHistorialFiltrado('por_revisar')}
          />
        )}
        <HoyPorObra data={obrasHoy.data} loading={obrasHoy.loading} error={obrasHoy.error} />
      </div>

      {/* Se monta desde el inicio (oculto) para que los filtros y la carga no se pierdan al cambiar de pestaña. */}
      {verHistorial && (
        <div id="panel-historial" role="tabpanel" aria-labelledby="tab-historial" hidden={tab !== 'historial'} className="pt-1">
          <JornadasGlobalView
            proyectos={proyectos}
            estado={estado}
            onEstadoChange={setEstado}
            sinCerrarTotal={pendientes.sinCerrar}
            porRevisarTotal={pendientes.porRevisar}
          />
        </div>
      )}
    </div>
  )
}

function AvisoPendiente({ texto, detalle, accion, onClick }: { texto: string; detalle: string; accion: string; onClick: () => void }) {
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-500/10 px-3.5 py-2.5 text-sm text-amber-800">
      <p>
        <span className="font-medium">{texto}</span> {detalle}
      </p>
      <button
        type="button"
        onClick={onClick}
        className="rounded-md border border-current px-2.5 py-1 text-xs font-medium transition-colors duration-[120ms] hover:bg-amber-500/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {accion}
      </button>
    </div>
  )
}
