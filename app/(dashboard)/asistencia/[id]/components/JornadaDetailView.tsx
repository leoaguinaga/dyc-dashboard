'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, LockIcon } from 'lucide-react'
import { api } from '@/lib/api/client'
import { useSession } from '@/lib/auth/session'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import type { AccesoConsolidadoItem, EstadoAsistencia, EstadoTurno, JornadaDetalle, TipoPersonaAcceso } from '@/types/api'

interface Props {
  turnoId: string
}

const ESTADO_LABEL: Record<EstadoAsistencia, string> = {
  presente: 'Presente',
  tardio: 'Tardío',
  falta: 'Falta',
}

const ESTADO_BADGE: Record<EstadoAsistencia, string> = {
  presente: 'bg-chart-2/15 text-chart-2',
  tardio: 'bg-amber-500/15 text-amber-600',
  falta: 'bg-destructive/15 text-destructive',
}

const ESTADO_TURNO_LABEL: Record<EstadoTurno, string> = {
  abierto: 'Abierto',
  cerrado: 'Cerrado',
}

const TIPO_LABEL: Record<Exclude<TipoPersonaAcceso, 'operario'>, string> = {
  staff: 'Staff',
  staff_oficina: 'Staff oficina',
  tercero: 'Tercero',
}

// Fecha solo-fecha (medianoche UTC = marcador de día calendario) — leer
// directo el ISO, sin convertir por timezone.
function formatFecha(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function formatHora(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })
}

function formatMonto(n: number) {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })
}

export function JornadaDetailView({ turnoId }: Props) {
  const { data: session } = useSession()
  const role = session?.user?.role
  const autorizado = role === 'administrador' || role === 'gerencia'

  const [jornada, setJornada] = useState<JornadaDetalle | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [tipo, setTipo] = useState<'todos' | Exclude<TipoPersonaAcceso, 'operario'>>('todos')
  const [acceso, setAcceso] = useState<AccesoConsolidadoItem[]>([])
  const [loadingAcceso, setLoadingAcceso] = useState(false)

  useEffect(() => {
    if (!autorizado) return
    async function cargar() {
      setLoading(true)
      setError(null)
      try {
        const data = await api.get<JornadaDetalle>(`/asistencias/jornadas/${turnoId}`)
        setJornada(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar la jornada')
      } finally {
        setLoading(false)
      }
    }
    void cargar()
  }, [autorizado, turnoId])

  useEffect(() => {
    if (!autorizado || !jornada) return
    async function cargarAcceso() {
      if (!jornada) return
      setLoadingAcceso(true)
      try {
        const fecha = jornada.fecha.slice(0, 10)
        const params = new URLSearchParams({ proyectoId: jornada.proyectoId, desde: fecha, hasta: fecha })
        if (tipo !== 'todos') params.set('tipo', tipo)
        const data = await api.get<AccesoConsolidadoItem[]>(`/asistencias/control-acceso?${params.toString()}`)
        setAcceso(data.filter((i) => i.tipo !== 'operario'))
      } catch {
        // sección secundaria — no bloquea el resto de la vista
      } finally {
        setLoadingAcceso(false)
      }
    }
    void cargarAcceso()
  }, [autorizado, jornada, tipo])

  const sorted = useMemo(() => {
    if (!jornada) return []
    return [...jornada.trabajadores].sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [jornada])

  if (!autorizado) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        <LockIcon className="size-4 shrink-0" />
        Solo Administración/Gerencia pueden ver el detalle de la jornada.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Link
        href="/asistencia"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Volver a jornadas
      </Link>

      {loading && <p className="text-sm text-muted-foreground">Cargando...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {jornada && (
        <>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{jornada.proyectoNombre}</h1>
            <p className="text-sm text-muted-foreground">
              {formatFecha(jornada.fecha)} · {formatHora(jornada.horaAperturaReal)} – {formatHora(jornada.horaCierreReal)}{' '}
              <span className={`ml-1 rounded-md px-2 py-0.5 text-xs font-medium ${jornada.estado === 'cerrado' ? 'bg-muted text-muted-foreground' : 'bg-chart-2/15 text-chart-2'}`}>
                {ESTADO_TURNO_LABEL[jornada.estado]}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs text-muted-foreground">Obreros</p>
              <p className="text-xl font-semibold tabular-nums">{jornada.trabajadores.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs text-muted-foreground">Horas normales</p>
              <p className="text-xl font-semibold tabular-nums">{jornada.totales.horasNormales.toFixed(1)}h</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs text-muted-foreground">Horas extra</p>
              <p className="text-xl font-semibold tabular-nums">{jornada.totales.horasExtra.toFixed(1)}h</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Trabajador</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Horas normales</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Horas extra</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">Precio/hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sorted.map((t) => (
                  <tr key={t.trabajadorId} className="hover:bg-muted/30 transition-colors duration-[120ms]">
                    <td className="px-4 py-3 font-medium">{t.nombre}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE[t.estado]}`}>
                        {ESTADO_LABEL[t.estado]}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{t.horasNormales.toFixed(1)}h</td>
                    <td className="px-4 py-3 tabular-nums">
                      {t.horasExtra > 0 ? `${t.horasExtra.toFixed(1)}h${t.pagarExtra ? '' : ' (sin pagar)'}` : '—'}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {t.precioHora != null ? formatMonto(t.precioHora) : 'Sin configurar'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Control de acceso del día</p>
              <Select value={tipo} onValueChange={(v) => setTipo((v ?? 'todos') as typeof tipo)}>
                <SelectTrigger className="max-w-48">
                  <p>Tipo</p>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  {(Object.keys(TIPO_LABEL) as (keyof typeof TIPO_LABEL)[]).map((t) => (
                    <SelectItem key={t} value={t}>{TIPO_LABEL[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loadingAcceso && <p className="text-sm text-muted-foreground">Cargando...</p>}

            {!loadingAcceso && acceso.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin staff, staff de oficina ni terceros registrados este día.</p>
            )}

            {acceso.length > 0 && (
              <div className="space-y-1.5">
                {acceso.map((it, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <span className="rounded-md bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-600">
                      {TIPO_LABEL[it.tipo as Exclude<TipoPersonaAcceso, 'operario'>]}
                    </span>
                    <span className="font-medium">{it.nombre}</span>
                    <span className="text-xs text-muted-foreground">{it.empresa ?? it.motivo ?? '—'}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatHora(it.horaEntrada)} – {formatHora(it.horaSalida)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
