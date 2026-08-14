'use client'

import { useEffect, useState } from 'react'
import { LockIcon } from 'lucide-react'
import { api } from '@/lib/api/client'
import { useSession } from '@/lib/auth/session'
import { DateRangePicker, type DateRangeValue } from '@/components/ui/date-range-picker'
import { hoyLimaISO } from '@/lib/date/fecha-lima'
import type { ConsolidadoTrabajador } from '@/types/api'

interface Props {
  trabajadorId: string
}

function rangoUltimos30Dias(): DateRangeValue {
  const hasta = hoyLimaISO()
  const [y, m, d] = hasta.split('-').map(Number)
  // Resta pura de calendario sobre la fecha "hoy" ya correcta en Lima — no
  // hay que volver a convertir por zona horaria (mismo cuidado que con
  // formatFecha en ConsolidadoAsistenciaSection.tsx).
  const desde = new Date(Date.UTC(y, m - 1, d - 30)).toISOString().slice(0, 10)
  return { desde, hasta }
}

export function ConsolidadoAsistenciaTrabajador({ trabajadorId }: Props) {
  const { data: session } = useSession()
  const role = session?.user?.role
  const autorizado = role === 'administrador' || role === 'admin_ti' || role === 'gerencia'

  const [rango, setRango] = useState<DateRangeValue>(rangoUltimos30Dias())
  const [consolidado, setConsolidado] = useState<ConsolidadoTrabajador | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!autorizado) return
    async function cargar() {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (rango.desde) params.set('desde', rango.desde)
      if (rango.hasta) params.set('hasta', rango.hasta)
      try {
        const data = await api.get<ConsolidadoTrabajador>(
          `/asistencias/trabajadores/${trabajadorId}/consolidado?${params.toString()}`,
        )
        setConsolidado(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el consolidado')
      } finally {
        setLoading(false)
      }
    }
    void cargar()
  }, [autorizado, rango.desde, rango.hasta, trabajadorId])

  if (!autorizado) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-white p-4 text-sm text-muted-foreground lg:col-span-3">
        <LockIcon className="size-4 shrink-0" />
        Solo Administración/Gerencia pueden ver el consolidado de asistencia.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-4 lg:col-span-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Consolidado de asistencia
        </h2>
        <DateRangePicker value={rango} onValueChange={setRango} className="max-w-64" />
      </div>

      {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {consolidado && !loading && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Horas normales</p>
              <p className="text-lg font-semibold tabular-nums">{consolidado.totales.horasNormales.toFixed(1)}h</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Horas extra</p>
              <p className="text-lg font-semibold tabular-nums">{consolidado.totales.horasExtra.toFixed(1)}h</p>
            </div>
          </div>

          {consolidado.porObra.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin asistencia registrada en este rango.</p>
          ) : (
            <div className="space-y-2">
              {consolidado.porObra.map((o) => (
                <div key={o.proyectoId} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  <span className="font-medium">{o.proyectoNombre}</span>
                  <span className="text-xs text-muted-foreground">{o.turnos.length} turnos</span>
                  <span className="tabular-nums">
                    {o.horasNormales.toFixed(1)}h{o.horasExtra > 0 && ` + ${o.horasExtra.toFixed(1)}h extra`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
