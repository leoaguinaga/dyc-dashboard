'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LockIcon } from 'lucide-react'
import { api, ApiError } from '@/lib/api/client'
import { useSession } from '@/lib/auth/session'
import { hoyLimaISO } from '@/lib/date/fecha-lima'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { Proyecto } from '@/types/api'

interface Props {
  obras: Proyecto[]
}

interface ObreroAsignado {
  trabajadorId: string
  nombre: string
  dni: string
  cargo: string
}

interface FilaHoja {
  incluido: boolean
  ingreso: string
  salida: string
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

export function RegistrarDesdeHojaForm({ obras }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const role = session?.user?.role
  const autorizado = role === 'administrador' || role === 'admin_ti' || role === 'gerencia' || role === 'jefe_sig'

  const [proyectoId, setProyectoId] = useState('')
  const [fecha, setFecha] = useState('')
  const [turnoConfigId, setTurnoConfigId] = useState('')
  const [obreros, setObreros] = useState<ObreroAsignado[] | null>(null)
  const [cargando, setCargando] = useState(false)
  const [errorObreros, setErrorObreros] = useState<string | null>(null)
  const [filas, setFilas] = useState<Record<string, FilaHoja>>({})
  const [masivo, setMasivo] = useState({ ingreso: '', salida: '' })
  const [pagarExtra, setPagarExtra] = useState(false)
  const [foto, setFoto] = useState<File | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existenteId, setExistenteId] = useState<string | null>(null)

  const obra = obras.find((o) => o.id === proyectoId)
  const horarios = useMemo(() => (obra?.turnoConfigs ?? []).filter((c) => c.activo), [obra])
  const horario = horarios.find((h) => h.id === turnoConfigId)

  function elegirObra(id: string) {
    setProyectoId(id)
    const activos = (obras.find((o) => o.id === id)?.turnoConfigs ?? []).filter((c) => c.activo)
    setTurnoConfigId(activos.length === 1 ? activos[0].id : '')
    setObreros(null)
  }

  // Al elegir obra, fecha y horario se traen los obreros asignados y se precarga el horario
  // completo de cada uno: la mayoría de las hojas registra a todos con la misma hora.
  useEffect(() => {
    if (!proyectoId || !fecha || !turnoConfigId || !horario) return
    let cancelado = false
    async function cargar() {
      setCargando(true)
      setErrorObreros(null)
      setObreros(null)
      try {
        const data = await api.get<ObreroAsignado[]>(
          `/asistencias/proyectos/${proyectoId}/turnos/obreros-para-hoja?fecha=${fecha}&turnoConfigId=${turnoConfigId}`,
        )
        if (cancelado) return
        setObreros(data)
        setFilas(Object.fromEntries(data.map((o) => [o.trabajadorId, { incluido: true, ingreso: horario!.horaInicio, salida: horario!.horaFin }])))
        setMasivo({ ingreso: horario!.horaInicio, salida: horario!.horaFin })
      } catch (err) {
        if (!cancelado) setErrorObreros(err instanceof Error ? err.message : 'No se pudieron cargar los obreros')
      } finally {
        if (!cancelado) setCargando(false)
      }
    }
    void cargar()
    return () => {
      cancelado = true
    }
  }, [proyectoId, fecha, turnoConfigId, horario])

  function actualizarFila(id: string, cambio: Partial<FilaHoja>) {
    setFilas((f) => ({ ...f, [id]: { ...f[id], ...cambio } }))
  }

  function aplicarATodos() {
    setFilas((f) =>
      Object.fromEntries(
        Object.entries(f).map(([id, fila]) => [id, { ...fila, ingreso: masivo.ingreso || fila.ingreso, salida: masivo.salida || fila.salida }]),
      ),
    )
  }

  const incluidos = (obreros ?? []).filter((o) => filas[o.trabajadorId]?.incluido)
  const filasInvalidas = incluidos.some((o) => !HHMM.test(filas[o.trabajadorId].ingreso) || !HHMM.test(filas[o.trabajadorId].salida))
  const puedeEnviar = !!proyectoId && !!fecha && !!turnoConfigId && incluidos.length > 0 && !filasInvalidas && !enviando

  async function enviar() {
    setEnviando(true)
    setError(null)
    setExistenteId(null)
    let turnoId: string
    try {
      const res = await api.post<{ turnoId: string }>(`/asistencias/proyectos/${proyectoId}/turnos/desde-hoja`, {
        turnoConfigId,
        fecha,
        pagarExtra,
        obreros: incluidos.map((o) => ({
          trabajadorId: o.trabajadorId,
          horaLlegadaReal: filas[o.trabajadorId].ingreso,
          horaSalidaReal: filas[o.trabajadorId].salida,
        })),
      })
      turnoId = res.turnoId
    } catch (err) {
      if (err instanceof ApiError && err.status === 409 && typeof err.body.turnoId === 'string') setExistenteId(err.body.turnoId)
      setError(err instanceof Error ? err.message : 'No se pudo registrar la jornada')
      setEnviando(false)
      return
    }

    if (foto) {
      try {
        const formData = new FormData()
        formData.append('foto', foto)
        await api.upload(`/asistencias/proyectos/${proyectoId}/turnos/${turnoId}/foto`, formData)
      } catch {
        setError('La jornada se registró, pero la foto no se pudo subir. Puedes adjuntarla desde el detalle de la jornada.')
        setExistenteId(turnoId)
        setEnviando(false)
        return
      }
    }
    router.push(`/asistencia/${turnoId}`)
  }

  if (!autorizado) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        <LockIcon className="size-4 shrink-0" />
        Solo Administración, Gerencia y Jefe SIG pueden registrar una jornada desde la hoja.
      </div>
    )
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (puedeEnviar) void enviar()
      }}
    >
      <fieldset className="grid gap-3 rounded-xl border border-border bg-white p-4 sm:grid-cols-3">
        <legend className="sr-only">Datos de la hoja</legend>
        <div className="space-y-1.5 sm:col-span-3">
          <label htmlFor="hoja-obra" className="text-sm font-medium">Obra</label>
          <Select value={proyectoId} onValueChange={(v) => elegirObra(v ?? '')}>
            <SelectTrigger id="hoja-obra" className="w-full">
              <span className="truncate">{obra ? obra.nombre : <span className="text-muted-foreground">Selecciona la obra de la hoja</span>}</span>
            </SelectTrigger>
            <SelectContent>
              {obras.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.nombre}{o.codigo ? ` · ${o.codigo}` : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="hoja-fecha" className="text-sm font-medium">Fecha de la hoja</label>
          <DatePicker value={fecha} onValueChange={(v) => { setFecha(v); setObreros(null) }} max={hoyLimaISO()} placeholder="Fecha del turno" />
          <p className="text-xs text-muted-foreground">En turnos de noche, el día en que empieza.</p>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="hoja-horario" className="text-sm font-medium">Horario</label>
          {horarios.length <= 1 ? (
            <p id="hoja-horario" className="flex h-8 items-center text-sm text-muted-foreground">
              {horario ? `${horario.nombre} (${horario.horaInicio}–${horario.horaFin})` : 'Se elige al seleccionar la obra'}
            </p>
          ) : (
            <Select value={turnoConfigId} onValueChange={(v) => { setTurnoConfigId(v ?? ''); setObreros(null) }}>
              <SelectTrigger id="hoja-horario" className="w-full">
                <span className="truncate">{horario ? `${horario.nombre} (${horario.horaInicio}–${horario.horaFin})` : <span className="text-muted-foreground">Selecciona el horario</span>}</span>
              </SelectTrigger>
              <SelectContent>
                {horarios.map((h) => (
                  <SelectItem key={h.id} value={h.id}>{h.nombre} ({h.horaInicio}–{h.horaFin})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </fieldset>

      {cargando && <p className="text-sm text-muted-foreground" role="status">Buscando obreros asignados...</p>}
      {errorObreros && <p role="alert" className="text-sm text-destructive">{errorObreros}</p>}

      {obreros && obreros.length === 0 && (
        <p className="rounded-xl border border-dashed border-border bg-white p-6 text-center text-sm text-muted-foreground">
          Esta obra no tiene obreros asignados a ese horario en esa fecha. Asígnalos en la obra y vuelve a intentar.
        </p>
      )}

      {obreros && obreros.length > 0 && (
        <section aria-labelledby="hoja-obreros" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="hoja-obreros" className="text-sm font-semibold">Obreros de la hoja</h2>
              <p className="text-xs text-muted-foreground">Desmarca a quien no figura en la hoja y corrige las horas que difieran.</p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="space-y-1 text-xs text-muted-foreground">
                Ingreso
                <Input type="time" value={masivo.ingreso} onChange={(e) => setMasivo((m) => ({ ...m, ingreso: e.target.value }))} className="w-28" />
              </label>
              <label className="space-y-1 text-xs text-muted-foreground">
                Salida
                <Input type="time" value={masivo.salida} onChange={(e) => setMasivo((m) => ({ ...m, salida: e.target.value }))} className="w-28" />
              </label>
              <Button type="button" variant="outline" size="sm" onClick={aplicarATodos}>Aplicar a todos</Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th scope="col" className="w-10 px-4 py-2"><span className="sr-only">Incluir</span></th>
                  <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Trabajador</th>
                  <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Ingreso</th>
                  <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-muted-foreground">Salida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {obreros.map((o) => {
                  const fila = filas[o.trabajadorId]
                  if (!fila) return null
                  return (
                    <tr key={o.trabajadorId} className={fila.incluido ? '' : 'opacity-50'}>
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={fila.incluido}
                          onChange={(e) => actualizarFila(o.trabajadorId, { incluido: e.target.checked })}
                          aria-label={`Incluir a ${o.nombre}`}
                          className="size-4 accent-[var(--primary)]"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <span className="font-medium">{o.nombre}</span>
                        <span className="block font-mono text-xs text-muted-foreground">{o.dni}</span>
                      </td>
                      <td className="px-2 py-2">
                        <Input type="time" disabled={!fila.incluido} value={fila.ingreso} onChange={(e) => actualizarFila(o.trabajadorId, { ingreso: e.target.value })} aria-label={`Ingreso de ${o.nombre}`} className="w-28 font-mono" />
                      </td>
                      <td className="px-2 py-2">
                        <Input type="time" disabled={!fila.incluido} value={fila.salida} onChange={(e) => actualizarFila(o.trabajadorId, { salida: e.target.value })} aria-label={`Salida de ${o.nombre}`} className="w-28 font-mono" />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 rounded-xl border border-border bg-white p-4 sm:grid-cols-2">
            <div className="flex flex-col items-start gap-2">
              <div className="space-y-0.5">
                <label htmlFor="hoja-extra" className="text-sm font-medium">Pagar horas extra</label>
                <p className="text-xs text-muted-foreground">Aplica solo a quien salió después de la tolerancia del horario. Si no lo tienes claro, déjalo apagado y decídelo al revisar.</p>
              </div>
              <Switch id="hoja-extra" checked={pagarExtra} onCheckedChange={setPagarExtra} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="hoja-foto" className="text-sm font-medium">Foto de la hoja <span className="font-normal text-muted-foreground">(opcional)</span></label>
              <input
                id="hoja-foto"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
                className="block w-full text-sm file:mr-3 file:rounded-md file:border file:border-border file:bg-white file:px-2.5 file:py-1 file:text-sm file:font-medium"
              />
              <p className="text-xs text-muted-foreground">Sin foto, la jornada queda registrada igual y la puedes adjuntar después desde su detalle.</p>
            </div>
          </div>
        </section>
      )}

      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
          <p>{error}</p>
          {existenteId && (
            <Link href={`/asistencia/${existenteId}`} className="rounded-md border border-current px-2.5 py-1 text-xs font-medium hover:bg-destructive/10">
              Abrir la jornada
            </Link>
          )}
        </div>
      )}

      {obreros && obreros.length > 0 && (
        <div className="flex flex-wrap items-center justify-end gap-3">
          <p className="text-xs text-muted-foreground">{incluidos.length} de {obreros.length} obreros incluidos</p>
          <Button type="submit" disabled={!puedeEnviar}>{enviando ? 'Registrando...' : 'Registrar jornada'}</Button>
        </div>
      )}
    </form>
  )
}
