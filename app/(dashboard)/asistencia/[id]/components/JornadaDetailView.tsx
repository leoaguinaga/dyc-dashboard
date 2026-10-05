'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ImageIcon, LockIcon, RotateCcwIcon } from 'lucide-react'
import { api, API_ORIGIN } from '@/lib/api/client'
import { useSession } from '@/lib/auth/session'
import { hoyLimaISO } from '@/lib/date/fecha-lima'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { AccesoConsolidadoItem, EstadoAsistencia, JornadaDetalle, TipoPersonaAcceso, TurnoDetalle } from '@/types/api'

interface Props {
  turnoId: string
}

const ESTADO_LABEL: Record<EstadoAsistencia, string> = {
  presente: 'Presente',
  tardio: 'Tardío',
  falta: 'Falta',
}

const ESTADO_BADGE: Record<EstadoAsistencia, string> = {
  presente: 'bg-chart-2/15 text-emerald-800',
  tardio: 'bg-amber-500/15 text-amber-800',
  falta: 'bg-destructive/10 text-destructive',
}

const TIPO_LABEL: Record<Exclude<TipoPersonaAcceso, 'operario'>, string> = {
  staff: 'Staff',
  staff_oficina: 'Staff oficina',
  tercero: 'Tercero',
}

// Fecha solo-fecha (medianoche UTC = marcador de día calendario) — leer
// directo el ISO, sin convertir por timezone.
function formatFechaLarga(iso: string) {
  return new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatFechaCorta(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function formatHora(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' })
}

function formatHoraInput(iso: string | null | undefined) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Lima' }).format(new Date(iso))
}

function formatMonto(n: number) {
  return n.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' })
}

function formatHoras(n: number) {
  return `${n.toFixed(1)}h`
}

export function JornadaDetailView({ turnoId }: Props) {
  const { data: session } = useSession()
  const role = session?.user?.role
  const autorizado = role === 'administrador' || role === 'admin_ti' || role === 'gerencia' || role === 'jefe_sig'
  const puedeReabrir = role === 'administrador' || role === 'admin_ti' || role === 'gerencia'
  const veTarifas = role !== 'jefe_sig'

  const [jornada, setJornada] = useState<JornadaDetalle | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [tipo, setTipo] = useState<'todos' | Exclude<TipoPersonaAcceso, 'operario'>>('todos')
  const [acceso, setAcceso] = useState<AccesoConsolidadoItem[]>([])
  const [loadingAcceso, setLoadingAcceso] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [reabriendo, setReabriendo] = useState(false)
  const [errorReapertura, setErrorReapertura] = useState<string | null>(null)
  const [revisando, setRevisando] = useState(false)
  const [errorRevision, setErrorRevision] = useState<string | null>(null)
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const [errorFoto, setErrorFoto] = useState<string | null>(null)
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null)
  const [horario, setHorario] = useState({ fecha: '', apertura: '', cierre: '' })
  const [tiempos, setTiempos] = useState<Record<string, { entrada: string; salida: string }>>({})

  function iniciarEdicion(data: JornadaDetalle) {
    setHorario({ fecha: data.fecha.slice(0, 10), apertura: formatHoraInput(data.horaAperturaReal), cierre: formatHoraInput(data.horaCierreReal) })
    setTiempos(Object.fromEntries(data.trabajadores.map((t) => [
      t.trabajadorId,
      { entrada: t.horaLlegadaReal ?? '', salida: t.horaSalidaReal ?? t.salidaTempranaHora ?? '' },
    ])))
  }

  async function recargar() {
    const data = await api.get<JornadaDetalle>(`/asistencias/jornadas/${turnoId}`)
    setJornada(data)
    return data
  }

  async function guardarTiempos() {
    if (!jornada) return
    setGuardandoEdicion(true)
    setErrorEdicion(null)
    try {
      const zona = '-05:00'
      await api.patch(`/asistencias/proyectos/${jornada.proyectoId}/turnos/${jornada.id}/horario`, {
        fecha: `${horario.fecha}T00:00:00.000Z`,
        horaAperturaReal: `${horario.fecha}T${horario.apertura}:00${zona}`,
        horaCierreReal: `${horario.fecha}T${horario.cierre}:00${zona}`,
      })
      const asistencias = jornada.trabajadores.map((t) => ({
        trabajadorId: t.trabajadorId,
        estado: t.estado,
        horaLlegadaReal: tiempos[t.trabajadorId]?.entrada || undefined,
        horaSalidaReal: tiempos[t.trabajadorId]?.salida || undefined,
      }))
      const data = await api.patch<TurnoDetalle>(`/asistencias/proyectos/${jornada.proyectoId}/turnos/${jornada.id}/asistencias`, { asistencias })
      setJornada((actual) => actual ? { ...actual, trabajadores: data.obreros.map((o) => ({
        trabajadorId: o.trabajadorId, nombre: o.nombre, dni: o.dni, estado: o.asistencia?.estado ?? 'falta',
        horasNormales: Number(o.asistencia?.horasNormales ?? 0), horasExtra: Number(o.asistencia?.horasExtra ?? 0), pagarExtra: o.asistencia?.pagarExtra ?? false,
        precioHora: null, horaLlegadaReal: o.asistencia?.horaLlegadaReal ?? null, horaSalidaReal: o.asistencia?.horaSalidaReal ?? null,
      })) } : actual)
    } catch (err) {
      setErrorEdicion(err instanceof Error ? err.message : 'No se pudieron guardar los tiempos')
    } finally {
      setGuardandoEdicion(false)
    }
  }

  async function revisarCierre(pagarExtra: boolean) {
    if (!jornada) return
    setRevisando(true)
    setErrorRevision(null)
    try {
      await api.patch(`/asistencias/proyectos/${jornada.proyectoId}/turnos/${jornada.id}/revisar-cierre`, { pagarExtra })
      await recargar()
    } catch (err) {
      setErrorRevision(err instanceof Error ? err.message : 'No se pudo registrar la revisión')
    } finally {
      setRevisando(false)
    }
  }

  async function subirFoto(file: File) {
    if (!jornada) return
    setSubiendoFoto(true)
    setErrorFoto(null)
    try {
      const formData = new FormData()
      formData.append('foto', file)
      await api.upload(`/asistencias/proyectos/${jornada.proyectoId}/turnos/${jornada.id}/foto`, formData)
      await recargar()
    } catch (err) {
      setErrorFoto(err instanceof Error ? err.message : 'No se pudo subir la foto')
    } finally {
      setSubiendoFoto(false)
    }
  }

  async function reabrirJornada() {
    if (!jornada || motivo.trim().length < 5) {
      setErrorReapertura('Escribe un motivo de al menos 5 caracteres.')
      return
    }
    setReabriendo(true)
    setErrorReapertura(null)
    try {
      await api.patch(`/asistencias/proyectos/${jornada.proyectoId}/turnos/${jornada.id}/reabrir`, { motivo: motivo.trim() })
      const data = await recargar()
      iniciarEdicion(data)
      setConfirmando(false)
      setMotivo('')
    } catch (err) {
      setErrorReapertura(err instanceof Error ? err.message : 'No se pudo reabrir la jornada')
    } finally {
      setReabriendo(false)
    }
  }

  useEffect(() => {
    if (!autorizado) return
    let cancelado = false
    async function cargar() {
      setLoading(true)
      setError(null)
      try {
        const data = await api.get<JornadaDetalle>(`/asistencias/jornadas/${turnoId}`)
        if (cancelado) return
        setJornada(data)
        iniciarEdicion(data)
      } catch (err) {
        if (!cancelado) setError(err instanceof Error ? err.message : 'Error al cargar la jornada')
      } finally {
        if (!cancelado) setLoading(false)
      }
    }
    void cargar()
    return () => {
      cancelado = true
    }
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
        Solo Administración, Gerencia y Jefe SIG pueden ver el detalle de la jornada.
      </div>
    )
  }

  const abierta = jornada?.estado === 'abierto'
  const sinCerrar = !!jornada && abierta && jornada.fecha.slice(0, 10) < hoyLimaISO()
  const porRevisar = !!jornada && jornada.cierreAutomatico && jornada.estado === 'cerrado' && !jornada.cierreRevisado
  const hayExtra = (jornada?.totales.horasExtra ?? 0) > 0
  const extraPagada = jornada ? jornada.trabajadores.some((t) => t.horasExtra > 0 && t.pagarExtra) : false
  const columnas = veTarifas ? 7 : 6

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link
        href="/asistencia"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-[120ms] hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Volver a Asistencia
      </Link>

      {loading && (
        <div className="space-y-3" aria-busy="true" aria-label="Cargando jornada">
          <div className="h-8 w-72 animate-pulse rounded-md bg-muted/60" />
          <div className="h-20 animate-pulse rounded-xl bg-muted/40" />
          <div className="h-48 animate-pulse rounded-xl bg-muted/40" />
        </div>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      {jornada && (
        <>
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">{jornada.proyectoNombre}</h1>
              <p className="text-sm capitalize text-muted-foreground">
                {formatFechaLarga(jornada.fecha)}
                <span className="normal-case"> · Turno {jornada.turnoNombre}{jornada.proyectoCodigo && <span className="font-mono"> · {jornada.proyectoCodigo}</span>}</span>
              </p>
              <div className="flex flex-wrap items-center gap-1.5">
                {sinCerrar ? (
                  <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-800">Sin cerrar</span>
                ) : abierta ? (
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">En curso</span>
                ) : (
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Cerrada</span>
                )}
                {jornada.origen === 'hoja' && (
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Desde hoja</span>
                )}
                {jornada.cierreAutomatico && (
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Cierre automático</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {jornada.origen === 'hoja'
                  ? `Registrada por ${jornada.abiertoPor?.name ?? 'oficina'} desde la hoja física.`
                  : `Abierta ${formatHora(jornada.horaAperturaReal)}${jornada.abiertoPor ? ` por ${jornada.abiertoPor.name}` : ''}${
                      jornada.horaCierreReal
                        ? ` · Cerrada ${formatHora(jornada.horaCierreReal)}${jornada.cerradoPor ? ` por ${jornada.cerradoPor.name}` : jornada.cierreAutomatico ? ' por el sistema' : ''}`
                        : ''
                    }`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {abierta && (
                <Link href={`/asistencia/turno/${jornada.proyectoId}`} className={buttonVariants({ variant: 'outline' })}>Ir al turno</Link>
              )}
              {!abierta && puedeReabrir && (
                <Button type="button" variant="outline" className="gap-1.5" onClick={() => setConfirmando(true)}>
                  <RotateCcwIcon className="size-3.5" aria-hidden /> Reabrir para corregir
                </Button>
              )}
            </div>
          </header>

          {(sinCerrar || porRevisar || jornada.corregidoEn) && (
            <div className="space-y-2">
              {sinCerrar && (
                <div role="status" className="rounded-lg bg-amber-500/10 px-3.5 py-2.5 text-sm text-amber-800">
                  <span className="font-medium">Esta jornada sigue abierta desde el {formatFechaCorta(jornada.fecha)}.</span> El sistema la cierra sola pasadas 4 horas de la hora fin del horario. También puedes cerrarla desde el turno.
                </div>
              )}
              {porRevisar && (
                <div role="status" className="space-y-2.5 rounded-lg bg-amber-500/10 px-3.5 py-3 text-sm text-amber-800">
                  <p>
                    <span className="font-medium">El sistema cerró esta jornada automáticamente</span> porque nadie la cerró a tiempo.
                    {hayExtra
                      ? ` A quienes no marcaron salida se les contó hasta las ${formatHora(jornada.horaCierreReal)}, lo que suma ${formatHoras(jornada.totales.horasExtra)} extra. Decide si se pagan.`
                      : ' Revisa que los registros sean correctos.'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {hayExtra ? (
                      <>
                        <Button type="button" size="sm" onClick={() => revisarCierre(true)} disabled={revisando}>Pagar horas extra</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => revisarCierre(false)} disabled={revisando}>No pagar horas extra</Button>
                      </>
                    ) : (
                      <Button type="button" size="sm" onClick={() => revisarCierre(false)} disabled={revisando}>Marcar como revisada</Button>
                    )}
                    <span className="text-xs">Si los tiempos no son correctos, reabre la jornada, corrígelos y ciérrala de nuevo.</span>
                  </div>
                  {errorRevision && <p role="alert" className="text-sm text-destructive">{errorRevision}</p>}
                </div>
              )}
              {jornada.corregidoEn && (
                <p className="rounded-lg bg-muted px-3.5 py-2 text-xs text-muted-foreground">
                  Reabierta por {jornada.corregidoPor?.name ?? 'un administrador'} el {new Date(jornada.corregidoEn).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Lima' })}
                  {jornada.motivoCorreccion && ` — ${jornada.motivoCorreccion}`}
                </p>
              )}
            </div>
          )}

          <dl className="grid grid-cols-2 divide-border overflow-hidden rounded-xl border border-border bg-white sm:grid-cols-4 sm:divide-x">
            <div className="space-y-0.5 p-4">
              <dt className="text-xs text-muted-foreground">Obreros</dt>
              <dd className="font-mono text-xl font-semibold tabular-nums">{jornada.trabajadores.length}</dd>
            </div>
            <div className="space-y-0.5 p-4">
              <dt className="text-xs text-muted-foreground">Horas normales</dt>
              <dd className="font-mono text-xl font-semibold tabular-nums">{formatHoras(jornada.totales.horasNormales)}</dd>
            </div>
            <div className="space-y-0.5 p-4">
              <dt className="text-xs text-muted-foreground">Horas extra</dt>
              <dd className="font-mono text-xl font-semibold tabular-nums">{formatHoras(jornada.totales.horasExtra)}</dd>
              {hayExtra && <p className="text-xs text-muted-foreground">{extraPagada ? 'Se pagan' : 'Sin pagar'}</p>}
            </div>
            <div className="space-y-0.5 p-4">
              <dt className="text-xs text-muted-foreground">Faltas y tardanzas</dt>
              <dd className="font-mono text-xl font-semibold tabular-nums">
                {jornada.trabajadores.filter((t) => t.estado === 'falta').length}
                <span className="text-muted-foreground"> / </span>
                {jornada.trabajadores.filter((t) => t.estado === 'tardio').length}
              </dd>
            </div>
          </dl>

          {abierta && (
            <fieldset className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-white p-4">
              <legend className="px-1 text-xs font-medium text-muted-foreground">Editar tiempos de la jornada</legend>
              <label className="space-y-1 text-xs text-muted-foreground">
                Fecha
                <Input type="date" value={horario.fecha} onChange={(e) => setHorario((v) => ({ ...v, fecha: e.target.value }))} className="w-40" />
              </label>
              <label className="space-y-1 text-xs text-muted-foreground">
                Desde
                <Input type="time" value={horario.apertura} onChange={(e) => setHorario((v) => ({ ...v, apertura: e.target.value }))} className="w-28 font-mono" />
              </label>
              <label className="space-y-1 text-xs text-muted-foreground">
                Hasta
                <Input type="time" value={horario.cierre} onChange={(e) => setHorario((v) => ({ ...v, cierre: e.target.value }))} className="w-28 font-mono" />
              </label>
              <Button type="button" onClick={guardarTiempos} disabled={guardandoEdicion}>
                {guardandoEdicion ? 'Guardando...' : 'Guardar tiempos y recalcular'}
              </Button>
              {errorEdicion && <p role="alert" className="w-full text-sm text-destructive">{errorEdicion}</p>}
            </fieldset>
          )}

          <Dialog open={confirmando} onOpenChange={(open) => !open && setConfirmando(false)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reabrir jornada</DialogTitle>
                <DialogDescription>La jornada volverá a estado abierto para corregir asistencias. El motivo quedará registrado.</DialogDescription>
              </DialogHeader>
              <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo de la corrección..." className="min-h-[80px]" aria-label="Motivo de la corrección" />
              {errorReapertura && <p role="alert" className="text-sm text-destructive">{errorReapertura}</p>}
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmando(false)} disabled={reabriendo}>Cancelar</Button>
                <Button onClick={reabrirJornada} disabled={reabriendo}>{reabriendo ? 'Reabriendo...' : 'Reabrir jornada'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <section aria-labelledby="titulo-obreros" className="space-y-2">
            <h2 id="titulo-obreros" className="text-sm font-semibold">Obreros de la jornada</h2>
            <div className="overflow-x-auto rounded-xl border border-border bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                    <th scope="col" className="px-4 py-2">Trabajador</th>
                    <th scope="col" className="px-4 py-2">Estado</th>
                    <th scope="col" className="px-4 py-2">Entrada</th>
                    <th scope="col" className="px-4 py-2">Salida</th>
                    <th scope="col" className="px-4 py-2 text-right">Normales</th>
                    <th scope="col" className="px-4 py-2 text-right">Extra</th>
                    {veTarifas && <th scope="col" className="px-4 py-2 text-right">Precio/hora</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sorted.length === 0 && (
                    <tr><td colSpan={columnas} className="px-4 py-6 text-center text-sm text-muted-foreground">Esta jornada no tiene obreros registrados.</td></tr>
                  )}
                  {sorted.map((t) => (
                    <tr key={t.trabajadorId} className="transition-colors duration-[120ms] hover:bg-muted/30">
                      <td className="px-4 py-2.5">
                        <span className="font-medium">{t.nombre}</span>
                        <span className="block font-mono text-xs text-muted-foreground">{t.dni}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${ESTADO_BADGE[t.estado]}`}>{ESTADO_LABEL[t.estado]}</span>
                      </td>
                      <td className="px-4 py-2.5 font-mono tabular-nums">
                        {abierta ? (
                          <Input type="time" value={tiempos[t.trabajadorId]?.entrada ?? ''} onChange={(e) => setTiempos((v) => ({ ...v, [t.trabajadorId]: { ...v[t.trabajadorId], entrada: e.target.value } }))} aria-label={`Entrada de ${t.nombre}`} className="w-28 font-mono" />
                        ) : (t.horaLlegadaReal || <span className="font-sans text-xs text-muted-foreground">A la hora</span>)}
                      </td>
                      <td className="px-4 py-2.5 font-mono tabular-nums">
                        {abierta ? (
                          <Input type="time" value={tiempos[t.trabajadorId]?.salida ?? ''} onChange={(e) => setTiempos((v) => ({ ...v, [t.trabajadorId]: { ...v[t.trabajadorId], salida: e.target.value } }))} aria-label={`Salida de ${t.nombre}`} className="w-28 font-mono" />
                        ) : (t.horaSalidaReal || (jornada.horaCierreReal ? formatHora(jornada.horaCierreReal) : '—'))}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">{formatHoras(t.horasNormales)}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                        {t.horasExtra > 0 ? (
                          <>{formatHoras(t.horasExtra)}<span className="block font-sans text-xs text-muted-foreground">{t.pagarExtra ? 'se paga' : 'sin pagar'}</span></>
                        ) : '—'}
                      </td>
                      {veTarifas && (
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                          {t.precioHora != null ? formatMonto(t.precioHora) : <span className="font-sans text-xs">Sin configurar</span>}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                {sorted.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-border bg-muted/30 text-sm font-medium">
                      <td className="px-4 py-2.5" colSpan={4}>Total</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">{formatHoras(jornada.totales.horasNormales)}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">{formatHoras(jornada.totales.horasExtra)}</td>
                      {veTarifas && <td />}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </section>

          <section aria-labelledby="titulo-evidencia" className="space-y-2">
            <h2 id="titulo-evidencia" className="text-sm font-semibold">Evidencia</h2>
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-white p-4">
              {jornada.fotoUrl ? (
                <a href={`${API_ORIGIN}${jornada.fotoUrl}`} target="_blank" rel="noreferrer" className="block shrink-0 overflow-hidden rounded-lg border border-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  {/* eslint-disable-next-line @next/next/no-img-element -- la foto viene del almacenamiento del backend */}
                  <img src={`${API_ORIGIN}${jornada.fotoUrl}`} alt={jornada.origen === 'hoja' ? 'Foto de la hoja de asistencia' : 'Foto del personal en obra'} className="h-24 w-32 object-cover" />
                </a>
              ) : (
                <div className="grid h-24 w-32 shrink-0 place-items-center rounded-lg border border-dashed border-border text-muted-foreground">
                  <ImageIcon className="size-6" aria-hidden />
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="text-sm">
                  {jornada.fotoUrl
                    ? jornada.origen === 'hoja' ? 'Foto de la hoja firmada.' : 'Foto del personal al abrir el turno.'
                    : jornada.origen === 'hoja' ? 'Se registró sin foto de la hoja.' : jornada.fotoOmitida ? 'El turno se abrió sin foto.' : 'Sin foto adjunta.'}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <label className={`${buttonVariants({ variant: 'outline', size: 'sm' })} cursor-pointer ${subiendoFoto ? 'pointer-events-none opacity-50' : ''} focus-within:ring-3 focus-within:ring-ring/50`}>
                    {'Tomar foto'}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="sr-only"
                      disabled={subiendoFoto}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        e.target.value = ''
                        if (file) void subirFoto(file)
                      }}
                    />
                  </label>
                  <label className={`${buttonVariants({ variant: 'outline', size: 'sm' })} cursor-pointer ${subiendoFoto ? 'pointer-events-none opacity-50' : ''} focus-within:ring-3 focus-within:ring-ring/50`}>
                    {subiendoFoto ? 'Subiendo...' : jornada.fotoUrl ? 'Reemplazar con archivo' : 'Subir archivo'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={subiendoFoto}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        e.target.value = ''
                        if (file) void subirFoto(file)
                      }}
                    />
                  </label>
                  {jornada.fotoUrl && (
                    <a href={`${API_ORIGIN}${jornada.fotoUrl}`} target="_blank" rel="noreferrer" className="text-xs text-primary underline-offset-2 hover:underline">Ver en tamaño completo</a>
                  )}
                </div>
                {errorFoto && <p role="alert" className="text-xs text-destructive">{errorFoto}</p>}
              </div>
            </div>
          </section>

          <section aria-labelledby="titulo-acceso" className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="titulo-acceso" className="text-sm font-semibold">Control de acceso del día</h2>
              <Select value={tipo} onValueChange={(v) => setTipo((v ?? 'todos') as typeof tipo)}>
                <SelectTrigger className="max-w-48" aria-label="Filtrar por tipo de persona">
                  <span className="truncate">
                    <span className="text-muted-foreground">Tipo: </span>
                    {tipo === 'todos' ? 'Todos' : TIPO_LABEL[tipo]}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los tipos</SelectItem>
                  {(Object.keys(TIPO_LABEL) as (keyof typeof TIPO_LABEL)[]).map((t) => (
                    <SelectItem key={t} value={t}>{TIPO_LABEL[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border border-border bg-white">
              {loadingAcceso && <p className="p-4 text-sm text-muted-foreground">Cargando...</p>}

              {!loadingAcceso && acceso.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">Sin staff, staff de oficina ni terceros registrados este día.</p>
              )}

              {acceso.length > 0 && (
                <ul className="divide-y divide-border">
                  {acceso.map((it, i) => (
                    <li key={i} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          {TIPO_LABEL[it.tipo as Exclude<TipoPersonaAcceso, 'operario'>]}
                        </span>
                        <span className="truncate font-medium">{it.nombre}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{it.empresa ?? it.motivo ?? '—'}</span>
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {formatHora(it.horaEntrada)} – {formatHora(it.horaSalida)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
