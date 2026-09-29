'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRightIcon, LockIcon } from 'lucide-react'
import { api } from '@/lib/api/client'
import { useSession } from '@/lib/auth/session'
import { hoyLimaISO } from '@/lib/date/fecha-lima'
import { DateRangePicker, type DateRangeValue } from '@/components/ui/date-range-picker'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import type { Jornada, Proyecto, Role } from '@/types/api'

export type FiltroEstado = 'todas' | 'sin_cerrar' | 'por_revisar' | 'cerradas'

interface Props {
  proyectos: Proyecto[]
  estado: FiltroEstado
  onEstadoChange: (estado: FiltroEstado) => void
  // Totales de todo el historial (no dependen del rango de fechas): salen del resumen de pendientes.
  sinCerrarTotal: number
  porRevisarTotal: number
}

const DIA_MS = 86_400_000
const DIAS_POR_TRAMO = 30

const ESTADO_SERVIDOR: Record<Exclude<FiltroEstado, 'todas'>, string> = {
  sin_cerrar: 'sin_cerrar',
  por_revisar: 'por_revisar',
  cerradas: 'cerrada',
}

// Ven el historial de todas las obras y entran al detalle de cada jornada.
export function puedeVerJornadas(role: Role | undefined) {
  return role === 'administrador' || role === 'admin_ti' || role === 'gerencia' || role === 'jefe_sig'
}

// Turno.fecha es solo-fecha (medianoche UTC = marcador de día calendario,
// no un instante real) — leer directo el ISO, no convertir por timezone.
export function formatFecha(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function diaUTC(iso: string) {
  return Date.parse(`${iso.slice(0, 10)}T00:00:00Z`)
}

export function diasAtras(iso: string, hoy: string) {
  return Math.round((diaUTC(hoy) - diaUTC(iso)) / DIA_MS)
}

function restarDias(iso: string, dias: number) {
  return new Date(diaUTC(iso) - dias * DIA_MS).toISOString().slice(0, 10)
}

function etiquetaDia(iso: string, hoy: string) {
  const dif = diasAtras(iso, hoy)
  if (dif === 0) return 'Hoy'
  if (dif === 1) return 'Ayer'
  const dia = new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('es-PE', { weekday: 'long' })
  return dia.charAt(0).toUpperCase() + dia.slice(1)
}

// Abierta de un día anterior: nadie la cerró y ya no corresponde a "hoy".
function esSinCerrarEn(j: Jornada, hoy: string) {
  return j.estado === 'abierto' && j.fecha.slice(0, 10) < hoy
}

// Cerrada por el sistema y todavía sin decisión sobre las horas extra.
function esPorRevisar(j: Jornada) {
  return j.cierreAutomatico && !j.cierreRevisado
}

function textoDias(n: number) {
  return n === 1 ? '1 d' : `${n} d`
}

export function JornadasGlobalView({ proyectos, estado, onEstadoChange, sinCerrarTotal, porRevisarTotal }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const role = session?.user?.role
  const autorizado = puedeVerJornadas(role)
  const hoy = hoyLimaISO()

  const [rango, setRango] = useState<DateRangeValue>({})
  const [proyectoId, setProyectoId] = useState('todos')
  const [dias, setDias] = useState(DIAS_POR_TRAMO)
  const [jornadas, setJornadas] = useState<Jornada[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sin un rango elegido, el historial muestra los últimos días y se amplía por tramos.
  // Las jornadas sin cerrar o por revisar se buscan en todo el historial: son pendientes, no archivo.
  const rangoPorDefecto = !rango.desde && !rango.hasta && (estado === 'todas' || estado === 'cerradas')
  const desdeEfectivo = rango.desde ?? (rangoPorDefecto ? restarDias(hoy, dias) : undefined)

  useEffect(() => {
    if (!autorizado) return
    let cancelado = false
    async function cargar() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        if (desdeEfectivo) params.set('desde', desdeEfectivo)
        if (rango.hasta) params.set('hasta', rango.hasta)
        if (proyectoId !== 'todos') params.set('proyectoId', proyectoId)
        if (estado !== 'todas') params.set('estado', ESTADO_SERVIDOR[estado])
        const data = await api.get<Jornada[]>(`/asistencias/jornadas?${params.toString()}`)
        if (!cancelado) setJornadas(data)
      } catch (err) {
        if (!cancelado) setError(err instanceof Error ? err.message : 'Error al cargar las jornadas')
      } finally {
        if (!cancelado) setLoading(false)
      }
    }
    void cargar()
    return () => {
      cancelado = true
    }
  }, [autorizado, desdeEfectivo, rango.hasta, proyectoId, estado])

  const resumen = useMemo(() => {
    const normales = jornadas.reduce((s, j) => s + j.horasNormales, 0)
    const extra = jornadas.reduce((s, j) => s + j.horasExtra, 0)
    return { jornadas: jornadas.length, normales, extra }
  }, [jornadas])

  // El nombre del turno solo aporta cuando la obra tiene más de un horario en pantalla.
  const obrasMultiTurno = useMemo(() => {
    const porObra = new Map<string, Set<string>>()
    jornadas.forEach((j) => {
      const set = porObra.get(j.proyectoId) ?? new Set<string>()
      set.add(j.turnoNombre)
      porObra.set(j.proyectoId, set)
    })
    return new Set([...porObra].filter(([, set]) => set.size > 1).map(([id]) => id))
  }, [jornadas])

  const grupos = useMemo(() => {
    const porDia = new Map<string, Jornada[]>()
    jornadas.forEach((j) => {
      const dia = j.fecha.slice(0, 10)
      porDia.set(dia, [...(porDia.get(dia) ?? []), j])
    })
    return [...porDia].sort(([a], [b]) => (a < b ? 1 : -1))
  }, [jornadas])

  const obraSeleccionada = proyectos.find((p) => p.id === proyectoId)
  const hayFiltros = proyectoId !== 'todos' || !!rango.desde || !!rango.hasta || estado !== 'todas'

  function limpiarFiltros() {
    setRango({})
    setProyectoId('todos')
    setDias(DIAS_POR_TRAMO)
    onEstadoChange('todas')
  }

  if (!autorizado) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        <LockIcon className="size-4 shrink-0" />
        Solo Administración, Gerencia y Jefe SIG pueden ver las jornadas.
      </div>
    )
  }

  const chips: { id: FiltroEstado; label: string }[] = [
    { id: 'todas', label: 'Todas' },
    { id: 'sin_cerrar', label: `Sin cerrar${sinCerrarTotal > 0 ? ` · ${sinCerrarTotal}` : ''}` },
    { id: 'por_revisar', label: `Por revisar${porRevisarTotal > 0 ? ` · ${porRevisarTotal}` : ''}` },
    { id: 'cerradas', label: 'Cerradas' },
  ]

  return (
    <section aria-labelledby="historial-titulo" className="space-y-3">
      <h2 id="historial-titulo" className="sr-only">Historial de jornadas</h2>

      <div className="flex flex-wrap items-center gap-2">
        <DateRangePicker value={rango} onValueChange={setRango} placeholder={rangoPorDefecto ? `Últimos ${dias} días` : 'Filtrar por fecha'} className="max-w-54 bg-white" />
        <Select value={proyectoId} onValueChange={(v) => setProyectoId(v ?? 'todos')}>
          <SelectTrigger className="w-fit max-w-64 bg-white" aria-label="Filtrar por obra">
            <span className="truncate">
              <span className="text-muted-foreground">Obra: </span>
              {obraSeleccionada ? obraSeleccionada.nombre : 'Todas'}
            </span>
          </SelectTrigger>
          <SelectContent className="w-full">
            <SelectItem value="todos">Todas las obras</SelectItem>
            {proyectos.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrar por estado">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={estado === c.id}
              onClick={() => onEstadoChange(c.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                estado === c.id ? 'border-transparent bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        {hayFiltros && (
          <button type="button" onClick={limpiarFiltros} className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
            Limpiar filtros
          </button>
        )}
        {!loading && jornadas.length > 0 && (
          <p className="ml-auto text-xs tabular-nums text-muted-foreground">
            {resumen.jornadas} {resumen.jornadas === 1 ? 'jornada' : 'jornadas'} · {resumen.normales.toFixed(1)}h
            {resumen.extra > 0 && ` + ${resumen.extra.toFixed(1)}h extra`}
          </p>
        )}
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {loading && (
        <div className="space-y-px overflow-hidden rounded-xl border border-border bg-white" aria-busy="true" aria-label="Cargando jornadas">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-11 animate-pulse bg-muted/40" />
          ))}
        </div>
      )}

      {!loading && !error && jornadas.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-white p-6 text-center text-sm text-muted-foreground">
          <p>
            {estado === 'sin_cerrar'
              ? 'No hay jornadas sin cerrar.'
              : estado === 'por_revisar'
                ? 'No hay cierres automáticos por revisar.'
                : 'Sin jornadas en este filtro.'}
          </p>
          {hayFiltros && (
            <button type="button" onClick={limpiarFiltros} className="mt-2 text-sm font-medium text-primary underline-offset-2 hover:underline">
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {!loading && jornadas.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Obra</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Obreros</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Horas</th>
                <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Estado</th>
                <th scope="col" className="w-8 px-2 py-2"><span className="sr-only">Abrir</span></th>
              </tr>
            </thead>
            {grupos.map(([dia, filas]) => (
              <tbody key={dia} className="divide-y divide-border border-t border-border">
                <tr className="bg-muted/30">
                  <th scope="colgroup" colSpan={5} className="px-4 py-1.5 text-left text-xs font-normal text-muted-foreground">
                    <span className="font-semibold text-foreground">{etiquetaDia(dia, hoy)}</span> · <span className="tabular-nums">{formatFecha(dia)}</span>
                  </th>
                </tr>
                {filas.map((j) => {
                  const sc = esSinCerrarEn(j, hoy)
                  const horasTotales = j.horasNormales + j.horasExtra
                  const href = `/asistencia/${j.id}`
                  return (
                    <tr
                      key={j.id}
                      onClick={() => router.push(href)}
                      className={`cursor-pointer transition-colors duration-[120ms] hover:bg-muted/30 ${sc ? 'bg-amber-500/5' : ''}`}
                    >
                      <td className="px-4 py-2.5">
                        <Link href={href} className="font-medium hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                          {j.proyectoNombre}
                        </Link>
                        {obrasMultiTurno.has(j.proyectoId) && <span className="text-xs text-muted-foreground"> · {j.turnoNombre}</span>}
                        {j.proyectoCodigo && <span className="block font-mono text-xs text-muted-foreground">{j.proyectoCodigo}</span>}
                      </td>
                      <td className="px-4 py-2.5 font-mono tabular-nums">{j.obreros}</td>
                      <td className="px-4 py-2.5 font-mono tabular-nums">
                        {j.estado === 'abierto' && horasTotales === 0
                          ? <span aria-label="Sin horas calculadas todavía">—</span>
                          : <>{j.horasNormales.toFixed(1)}h{j.horasExtra > 0 && ` + ${j.horasExtra.toFixed(1)}h extra`}</>}
                      </td>
                      <td className="px-4 py-2.5">
                        {sc ? (
                          <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800">
                            Sin cerrar · {textoDias(diasAtras(j.fecha, hoy))}
                          </span>
                        ) : esPorRevisar(j) ? (
                          <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800">
                            Cierre automático · por revisar
                          </span>
                        ) : j.estado === 'abierto' ? (
                          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">En curso</span>
                        ) : (
                          <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            Cerrada{j.cierreAutomatico ? ' · automático' : j.origen === 'hoja' ? ' · desde hoja' : ''}
                          </span>
                        )}
                      </td>
                      <td className="w-8 px-2 py-2.5 text-muted-foreground">
                        <ChevronRightIcon className="size-4" aria-hidden />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            ))}
          </table>
        </div>
      )}

      {rangoPorDefecto && !loading && !error && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>Mostrando los últimos {dias} días.</p>
          <button
            type="button"
            onClick={() => setDias((d) => d + DIAS_POR_TRAMO)}
            className="rounded-md border border-border px-2.5 py-1 font-medium text-foreground transition-colors duration-[120ms] hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Ver {DIAS_POR_TRAMO} días anteriores
          </button>
        </div>
      )}
    </section>
  )
}
