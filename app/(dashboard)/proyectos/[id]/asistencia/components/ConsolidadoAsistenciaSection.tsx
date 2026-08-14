'use client'

import { useEffect, useState } from 'react'
import { CalculatorIcon, ChevronDownIcon, LockIcon, ReceiptIcon } from 'lucide-react'
import { api } from '@/lib/api/client'
import { useSession } from '@/lib/auth/session'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DateRangePicker, type DateRangeValue } from '@/components/ui/date-range-picker'
import type { ConsolidadoObra, Planilla, PlanillaPreview } from '@/types/api'

interface Props {
  proyectoId: string
}

// Turno.fecha es un campo solo-fecha (medianoche UTC = marcador de día
// calendario, no un instante real) — convertir con `timeZone` lo interpreta
// como instante y lo corre un día atrás. Se lee directo del ISO en vez de
// pasar por Date + timeZone.
function formatFecha(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

// A diferencia de formatFecha, este sí recibe un instante real (ej.
// Planilla.generadaEn) — aquí sí corresponde convertir a hora Lima.
function formatFechaHora(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Lima' })
}

function formatMonto(n: number) {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })
}

function quincena(tipo: 1 | 2): DateRangeValue {
  const hoy = new Date()
  const y = hoy.getFullYear()
  const m = hoy.getMonth()
  if (tipo === 1) {
    return { desde: `${y}-${String(m + 1).padStart(2, '0')}-01`, hasta: `${y}-${String(m + 1).padStart(2, '0')}-15` }
  }
  const finMes = new Date(y, m + 1, 0).getDate()
  return { desde: `${y}-${String(m + 1).padStart(2, '0')}-16`, hasta: `${y}-${String(m + 1).padStart(2, '0')}-${String(finMes).padStart(2, '0')}` }
}

export function ConsolidadoAsistenciaSection({ proyectoId }: Props) {
  const { data: session } = useSession()
  const role = session?.user?.role
  const autorizado = role === 'administrador' || role === 'admin_ti' || role === 'gerencia'

  const [rango, setRango] = useState<DateRangeValue>(quincena(1))
  const [consolidado, setConsolidado] = useState<ConsolidadoObra | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [valorHoraExtra, setValorHoraExtra] = useState('0')
  const [planilla, setPlanilla] = useState<PlanillaPreview | null>(null)
  const [loadingPlanilla, setLoadingPlanilla] = useState(false)
  const [errorPlanilla, setErrorPlanilla] = useState<string | null>(null)

  const [generando, setGenerando] = useState(false)
  const [errorGenerar, setErrorGenerar] = useState<string | null>(null)
  const [planillas, setPlanillas] = useState<Planilla[]>([])
  const [expandidaId, setExpandidaId] = useState<string | null>(null)
  const [detalle, setDetalle] = useState<Record<string, Planilla>>({})

  useEffect(() => {
    if (!autorizado || !rango.desde || !rango.hasta) return
    async function cargar() {
      setLoading(true)
      setError(null)
      setPlanilla(null)
      try {
        const data = await api.get<ConsolidadoObra>(
          `/asistencias/proyectos/${proyectoId}/consolidado?desde=${rango.desde}&hasta=${rango.hasta}`,
        )
        setConsolidado(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el consolidado')
      } finally {
        setLoading(false)
      }
    }
    void cargar()
  }, [autorizado, rango.desde, rango.hasta, proyectoId])

  useEffect(() => {
    if (!autorizado) return
    async function cargarPlanillas() {
      try {
        const data = await api.get<Planilla[]>(`/asistencias/proyectos/${proyectoId}/planillas`)
        setPlanillas(data)
      } catch {
        // silencioso — la lista de planillas generadas es informativa, no bloquea el resto de la vista
      }
    }
    void cargarPlanillas()
  }, [autorizado, proyectoId])

  async function calcularPlanilla() {
    if (!rango.desde || !rango.hasta) return
    setLoadingPlanilla(true)
    setErrorPlanilla(null)
    try {
      const data = await api.get<PlanillaPreview>(
        `/asistencias/proyectos/${proyectoId}/planilla-preview?desde=${rango.desde}&hasta=${rango.hasta}&valorHoraExtra=${valorHoraExtra || 0}`,
      )
      setPlanilla(data)
    } catch (err) {
      setErrorPlanilla(err instanceof Error ? err.message : 'Error al calcular la planilla')
    } finally {
      setLoadingPlanilla(false)
    }
  }

  async function generarPlanilla() {
    if (!rango.desde || !rango.hasta) return
    setGenerando(true)
    setErrorGenerar(null)
    try {
      const nueva = await api.post<Planilla>(`/asistencias/proyectos/${proyectoId}/planillas`, {
        desde: rango.desde,
        hasta: rango.hasta,
        valorHoraExtra: Number(valorHoraExtra) || 0,
      })
      setPlanillas((prev) => [nueva, ...prev])
      setPlanilla(null)
    } catch (err) {
      setErrorGenerar(err instanceof Error ? err.message : 'Error al generar la planilla')
    } finally {
      setGenerando(false)
    }
  }

  async function toggleExpandir(planillaId: string) {
    if (expandidaId === planillaId) {
      setExpandidaId(null)
      return
    }
    setExpandidaId(planillaId)
    if (!detalle[planillaId]) {
      try {
        const data = await api.get<Planilla>(`/asistencias/proyectos/${proyectoId}/planillas/${planillaId}`)
        setDetalle((prev) => ({ ...prev, [planillaId]: data }))
      } catch {
        // el usuario puede reintentar cerrando y abriendo de nuevo
      }
    }
  }

  if (!autorizado) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        <LockIcon className="size-4 shrink-0" />
        Solo Administración/Gerencia pueden ver el consolidado y la planilla.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-white p-4">
        <DateRangePicker value={rango} onValueChange={setRango} className="max-w-64" />
        <Button type="button" variant="outline" size="sm" onClick={() => setRango(quincena(1))}>
          Quincena 1-15
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setRango(quincena(2))}>
          Quincena 16-fin
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Cargando consolidado...</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {consolidado && !loading && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs text-muted-foreground">Horas normales (periodo)</p>
              <p className="text-xl font-semibold tabular-nums">{consolidado.totales.horasNormales.toFixed(1)}h</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs text-muted-foreground">Horas extra (periodo)</p>
              <p className="text-xl font-semibold tabular-nums">{consolidado.totales.horasExtra.toFixed(1)}h</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white p-4">
            <p className="mb-3 text-sm font-medium">Turnos en el periodo</p>
            {consolidado.turnos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin turnos en este rango.</p>
            ) : (
              <div className="space-y-1.5">
                {consolidado.turnos.map((t) => (
                  <div key={t.turnoId} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <span>{formatFecha(t.fecha)}</span>
                    <span className="text-xs text-muted-foreground">{t.obreros} obreros</span>
                    <span className="tabular-nums">{t.horasNormales.toFixed(1)}h{t.horasExtra > 0 && ` + ${t.horasExtra.toFixed(1)}h extra`}</span>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${t.estado === 'cerrado' ? 'bg-muted text-muted-foreground' : 'bg-chart-2/15 text-chart-2'}`}>
                      {t.estado === 'cerrado' ? 'Cerrado' : 'Abierto'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-white p-4">
            <p className="mb-3 text-sm font-medium">Por trabajador</p>
            {consolidado.porTrabajador.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos en este rango.</p>
            ) : (
              <div className="space-y-1.5">
                {consolidado.porTrabajador.map((t) => (
                  <div key={t.trabajadorId} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <span>{t.nombre}</span>
                    <span className="text-xs text-muted-foreground">{t.turnos} turnos</span>
                    <span className="tabular-nums">{t.horasNormales.toFixed(1)}h{t.horasExtra > 0 && ` + ${t.horasExtra.toFixed(1)}h extra`}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <div className="space-y-3 rounded-xl border border-border bg-white p-4">
        <div>
          <p className="text-sm font-medium">Planilla (vista previa)</p>
          <p className="text-xs text-muted-foreground">
            Calcula el monto por horas normales (precio hora-hombre del trabajador) y horas extra pagables para el periodo seleccionado arriba. No se guarda todavía — solo vista previa.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground shrink-0">Valor hora extra</label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={valorHoraExtra}
            onChange={(e) => setValorHoraExtra(e.target.value)}
            className="max-w-32"
          />
          <Button type="button" size="sm" onClick={calcularPlanilla} disabled={loadingPlanilla} className="gap-1.5">
            <CalculatorIcon className="size-3.5" />
            {loadingPlanilla ? 'Calculando...' : 'Calcular'}
          </Button>
        </div>

        {errorPlanilla && <p className="text-sm text-destructive">{errorPlanilla}</p>}
        {errorGenerar && <p className="text-sm text-destructive">{errorGenerar}</p>}

        {planilla && (
          <div className="space-y-1.5">
            {planilla.trabajadores.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin turnos cerrados en este periodo.</p>
            ) : (
              planilla.trabajadores.map((t) => (
                <div key={t.trabajadorId} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  <div>
                    <p>{t.nombre}</p>
                    {t.sinTarifa && <p className="text-xs text-amber-600">Sin precio hora-hombre configurado</p>}
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {t.horasNormales.toFixed(1)}h{t.horasExtraPagable > 0 && ` + ${t.horasExtraPagable.toFixed(1)}h extra`}
                  </span>
                  <span className="font-medium tabular-nums">{formatMonto(t.total)}</span>
                </div>
              ))
            )}
            <div className="flex items-center justify-between gap-2 rounded-lg border-t border-border px-3 pt-2 text-sm font-semibold">
              <span>Total periodo</span>
              <span className="tabular-nums">{formatMonto(planilla.totalGeneral)}</span>
            </div>
            {planilla.trabajadores.length > 0 && (
              <Button type="button" variant="outline" onClick={generarPlanilla} disabled={generando} className="w-full gap-1.5">
                <ReceiptIcon className="size-4" />
                {generando ? 'Generando...' : 'Generar planilla (guardar)'}
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-white p-4">
        <p className="text-sm font-medium">Planillas generadas</p>
        {planillas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no se generó ninguna planilla para esta obra.</p>
        ) : (
          <div className="space-y-1.5">
            {planillas.map((p) => {
              const item = detalle[p.id]
              const expandida = expandidaId === p.id
              return (
                <div key={p.id} className="rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => toggleExpandir(p.id)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted/40"
                  >
                    <div>
                      <p className="font-medium">{formatFecha(p.periodoInicio)} – {formatFecha(p.periodoFin)}</p>
                      <p className="text-xs text-muted-foreground">
                        Generada por {p.generadaPor?.name ?? '—'} el {formatFechaHora(p.generadaEn)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold tabular-nums">{formatMonto(Number(p.totalGeneral))}</span>
                      <ChevronDownIcon className={`size-4 text-muted-foreground transition-transform ${expandida ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  {expandida && (
                    <div className="space-y-1 border-t border-border p-3">
                      {!item ? (
                        <p className="text-xs text-muted-foreground">Cargando detalle...</p>
                      ) : (
                        item.items?.map((it) => (
                          <div key={it.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/40 px-2.5 py-1.5 text-xs">
                            <span>{it.trabajador?.nombre}</span>
                            <span className="text-muted-foreground tabular-nums">
                              {Number(it.horasNormales).toFixed(1)}h{Number(it.horasExtraPagable) > 0 && ` + ${Number(it.horasExtraPagable).toFixed(1)}h extra`}
                            </span>
                            <span className="font-medium tabular-nums">{formatMonto(Number(it.total))}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
