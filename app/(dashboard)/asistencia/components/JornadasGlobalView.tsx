'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { LockIcon } from 'lucide-react'
import { api } from '@/lib/api/client'
import { useSession } from '@/lib/auth/session'
import { DateRangePicker, type DateRangeValue } from '@/components/ui/date-range-picker'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import type { EstadoTurno, Jornada, Proyecto } from '@/types/api'

interface Props {
  proyectos: Proyecto[]
}

const ESTADO_LABEL: Record<EstadoTurno, string> = {
  abierto: 'Abierto',
  cerrado: 'Cerrado',
}

const ESTADO_BADGE: Record<EstadoTurno, string> = {
  abierto: 'bg-chart-2/15 text-chart-2',
  cerrado: 'bg-muted text-muted-foreground',
}

// Turno.fecha es solo-fecha (medianoche UTC = marcador de día calendario,
// no un instante real) — leer directo el ISO, no convertir por timezone.
function formatFecha(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export function JornadasGlobalView({ proyectos }: Props) {
  const { data: session } = useSession()
  const role = session?.user?.role
  const autorizado = role === 'administrador' || role === 'admin_ti' || role === 'gerencia'

  const [rango, setRango] = useState<DateRangeValue>({})
  const [proyectoId, setProyectoId] = useState('todos')
  const [jornadas, setJornadas] = useState<Jornada[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!autorizado) return
    async function cargar() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (rango.desde) params.set('desde', rango.desde)
        if (rango.hasta) params.set('hasta', rango.hasta)
        if (proyectoId !== 'todos') params.set('proyectoId', proyectoId)
        const data = await api.get<Jornada[]>(`/asistencias/jornadas?${params.toString()}`)
        setJornadas(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar las jornadas')
      } finally {
        setLoading(false)
      }
    }
    void cargar()
  }, [autorizado, rango.desde, rango.hasta, proyectoId])

  const kpis = useMemo(() => {
    const horasNormales = jornadas.reduce((s, j) => s + j.horasNormales, 0)
    const horasExtra = jornadas.reduce((s, j) => s + j.horasExtra, 0)
    const obreros = jornadas.reduce((s, j) => s + j.obreros, 0)
    return { jornadas: jornadas.length, horasNormales, horasExtra, obreros }
  }, [jornadas])

  if (!autorizado) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        <LockIcon className="size-4 shrink-0" />
        Solo Administración/Gerencia pueden ver las jornadas.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <DateRangePicker value={rango} onValueChange={setRango} placeholder="Filtrar por fecha" className="max-w-54 bg-white" />
        <Select value={proyectoId} onValueChange={(v) => setProyectoId(v ?? 'todos')}>
          <SelectTrigger className="w-fit bg-white">
            <p>Obra</p>
          </SelectTrigger>
          <SelectContent className="w-full">
            <SelectItem value="todos">Todas las obras</SelectItem>
            {proyectos.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {
        !loading && jornadas.length === 0 && !error && (
          <p className="rounded-xl border border-dashed border-border bg-white p-6 text-center text-sm text-muted-foreground">
            Sin jornadas en este filtro.
          </p>
        )
      }

      {
        jornadas.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2.5 text-left text-sm font-medium text-muted-foreground">Fecha</th>
                  <th className="px-4 py-2.5 text-left text-sm font-medium text-muted-foreground">Obra</th>
                  <th className="px-4 py-2.5 text-left text-sm font-medium text-muted-foreground">Obreros</th>
                  <th className="px-4 py-2.5 text-left text-sm font-medium text-muted-foreground">Horas</th>
                  <th className="px-4 py-2.5 text-left text-sm font-medium text-muted-foreground">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {jornadas.map((j) => (
                  <tr key={j.id} className="hover:bg-muted/30 transition-colors duration-[120ms]">
                    <td className="px-4 py-3">
                      <Link href={`/asistencia/${j.id}`} className="font-medium tabular-nums hover:text-primary transition-colors duration-[120ms]">
                        {formatFecha(j.fecha)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {j.proyectoNombre} <span className="text-xs">· {j.turnoNombre}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{j.obreros}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {j.horasNormales.toFixed(1)}h{j.horasExtra > 0 && ` + ${j.horasExtra.toFixed(1)}h extra`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE[j.estado]}`}>
                        {ESTADO_LABEL[j.estado]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div >
  )
}
