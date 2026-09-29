'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TriangleAlertIcon } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { useSession } from '@/lib/auth/session'
import { abrirTurnoDeObra, accionDe, detalleObra, estadoDe, ORDEN_ESTADO, type EstadoObra } from './obra-hoy'
import type { ObraHoy, ObrasHoyResponse } from '@/types/api'

const PILL: Record<EstadoObra, { label: string; className: string }> = {
  en_curso: { label: 'En curso', className: 'bg-primary/10 text-primary' },
  sin_abrir: { label: 'Sin abrir', className: 'bg-muted text-muted-foreground' },
  cerrada: { label: 'Cerrada', className: 'bg-muted text-muted-foreground' },
  sin_horario: { label: 'Sin horario', className: 'bg-amber-500/15 text-amber-700' },
}

// `fecha` llega como YYYY-MM-DD (día calendario de Lima). Se fija al mediodía
// para que el formateo local no la corra de día.
function formatoDia(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })
}

interface Props {
  data: ObrasHoyResponse | null
  loading: boolean
  error: string | null
}

export function HoyPorObra({ data, loading, error }: Props) {
  const { data: session } = useSession()
  const role = session?.user?.role
  const esPdr = role === 'pdr'
  const puedeConfigurar = role === 'administrador' || role === 'admin_ti' || role === 'gerencia'

  const obras = useMemo(() => {
    if (!data) return []
    return data.obras
      .map((obra) => ({ obra, estado: estadoDe(obra) }))
      .sort((a, b) => ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado])
  }, [data])

  const resumen = useMemo(() => {
    const cuenta: Record<EstadoObra, number> = { en_curso: 0, sin_abrir: 0, cerrada: 0, sin_horario: 0 }
    obras.forEach((o) => { cuenta[o.estado] += 1 })
    return [
      cuenta.en_curso > 0 && `${cuenta.en_curso} en curso`,
      cuenta.sin_abrir > 0 && `${cuenta.sin_abrir} sin abrir`,
      cuenta.cerrada > 0 && `${cuenta.cerrada} cerrada${cuenta.cerrada > 1 ? 's' : ''}`,
      cuenta.sin_horario > 0 && `${cuenta.sin_horario} sin horario`,
    ].filter(Boolean).join(' · ')
  }, [obras])

  return (
    <section aria-labelledby="hoy-titulo" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="hoy-titulo" className="text-sm font-semibold">
          Hoy{data && <span className="font-normal text-muted-foreground"> · {formatoDia(data.fecha)}</span>}
        </h2>
        {resumen && <p className="text-xs text-muted-foreground">{resumen}</p>}
      </div>

      {loading && (
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Cargando obras de hoy">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[132px] animate-pulse rounded-xl border border-border bg-muted/40" />
          ))}
        </div>
      )}

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {!loading && !error && obras.length === 0 && (
        <p className="rounded-xl border border-dashed border-border bg-white p-6 text-center text-sm text-muted-foreground">
          {esPdr
            ? 'No tienes obras asignadas como prevencionista de riesgos.'
            : 'No hay obras en planificación o ejecución.'}
        </p>
      )}

      {obras.length > 0 && (
        <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {obras.map(({ obra, estado }) => (
            <li key={obra.proyectoId}>
              <ObraCard obra={obra} estado={estado} esPdr={esPdr} puedeConfigurar={puedeConfigurar} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ObraCard({ obra, estado, esPdr, puedeConfigurar }: { obra: ObraHoy; estado: EstadoObra; esPdr: boolean; puedeConfigurar: boolean }) {
  const router = useRouter()
  const [abriendo, setAbriendo] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pill = PILL[estado]
  const accion = accionDe(obra, estado, { esPdr, puedeConfigurar })
  const detalle = detalleObra(obra, estado)
  const esPrimaria = estado === 'en_curso'

  async function abrirTurno() {
    setAbriendo(true)
    setError(null)
    try {
      await abrirTurnoDeObra(obra)
      router.push(`/asistencia/turno/${obra.proyectoId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al abrir el turno')
      setAbriendo(false)
    }
  }

  const variante = buttonVariants({ size: 'sm', variant: esPrimaria ? 'default' : 'outline' })

  return (
    <div className={`flex h-full flex-col justify-between gap-3 rounded-xl border bg-white p-3.5 ${estado === 'sin_horario' ? 'border-dashed border-border' : estado === 'en_curso' ? 'border-primary/40' : 'border-border'}`}>
      <div className="space-y-0.5">
        <p className="text-sm font-medium leading-snug">{obra.nombre}</p>
        {obra.codigo && <p className="font-mono text-xs text-muted-foreground">{obra.codigo}</p>}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${pill.className}`}>
          {estado === 'sin_horario' && <TriangleAlertIcon className="size-3" aria-hidden />}
          {pill.label}
        </span>
        {detalle && <span className="text-xs tabular-nums text-muted-foreground">{detalle}</span>}
      </div>
      {accion && (
        <div>
          {accion.abrir ? (
            <Button size="sm" variant="outline" onClick={abrirTurno} disabled={abriendo}>{abriendo ? 'Abriendo...' : accion.label}</Button>
          ) : (
            <Link href={accion.href ?? '#'} className={variante}>{accion.label}</Link>
          )}
        </div>
      )}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
